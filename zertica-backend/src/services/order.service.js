'use strict';

const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { round2, volumeDiscountPercent } = require('../utils/money');
const addressService = require('./address.service');
const paymentService = require('./payment.service');
const { toMeta } = require('./dto');
const { escapeLike } = require('../models/product.model');

/** Transiciones válidas que puede aplicar el administrador. */
const TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

const ORDER_COLUMNS = `o.*, u.full_name AS customer_name, u.username AS customer_username, co.name AS company_name,
  i.code AS invoice_code, i.status AS invoice_status`;
const ORDER_JOINS = `FROM orders o
  JOIN users u ON u.id = o.user_id
  LEFT JOIN companies co ON co.id = o.company_id
  LEFT JOIN invoices i ON i.order_id = o.id`;

function toOrderDto(r, items) {
  const dto = {
    id: r.id,
    code: r.code,
    status: r.status,
    itemCount: r.item_count,
    subtotal: Number(r.subtotal),
    discountPercent: Number(r.discount_percent),
    discount: Number(r.discount),
    total: Number(r.total),
    paymentType: r.payment_type,
    paymentLabel: r.payment_label,
    shippingAddress: r.shipping_address,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    customer: { id: r.user_id, fullName: r.customer_name, username: r.customer_username },
    company: r.company_id ? { id: r.company_id, name: r.company_name } : null,
    invoice: r.invoice_code ? { code: r.invoice_code, status: r.invoice_status } : null,
    allowedTransitions: TRANSITIONS[r.status],
  };
  if (items) {
    dto.items = items.map((it) => ({
      productId: it.product_id,
      name: it.product_name,
      reference: it.reference,
      categoryName: it.category_name,
      unitPrice: Number(it.unit_price),
      quantity: it.quantity,
      lineTotal: Number(it.line_total),
    }));
  }
  return dto;
}

async function getById(id, { userId } = {}) {
  const [rows] = await pool.query(`SELECT ${ORDER_COLUMNS} ${ORDER_JOINS} WHERE o.id = ?`, [id]);
  const r = rows[0];
  if (!r || (userId && r.user_id !== userId)) throw ApiError.notFound('ORDER_NOT_FOUND', 'El pedido no existe.');
  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [id]);
  return { data: toOrderDto(r, items) };
}

async function list({ userId, companyId, status, search, page, limit }) {
  const where = [];
  const params = [];
  if (userId) { where.push('o.user_id = ?'); params.push(userId); }
  if (companyId) { where.push('o.company_id = ?'); params.push(companyId); }
  if (status === 'active') where.push("o.status IN ('pending','processing','shipped')");
  else if (status && status !== 'all') { where.push('o.status = ?'); params.push(status); }
  if (search) {
    const like = `%${escapeLike(search)}%`;
    where.push('(o.code LIKE ? OR u.full_name LIKE ? OR co.name LIKE ?)');
    params.push(like, like, like);
  }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT ${ORDER_COLUMNS} ${ORDER_JOINS} ${w} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit],
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${ORDER_JOINS} ${w}`, params);
  return { data: rows.map((r) => toOrderDto(r)), meta: toMeta(page, limit, Number(total)) };
}

/**
 * Crea un pedido en una transacción: bloquea productos, valida existencias,
 * aplica descuento por volumen (Empresa), descuenta stock, genera la factura
 * de empresa y vacía el carrito si el pedido salió de él.
 * El pago con tarjeta es SIMULADO (no hay pasarela): se aprueba si la tarjeta
 * pertenece al usuario y no está vencida.
 */
async function create(user, input) {
  const isCompany = user.role === 'company';
  if (input.paymentType === 'credit' && !isCompany) {
    throw ApiError.validation([{ field: 'paymentType', code: 'INVALID_PAYMENT' }]);
  }
  const conn = await pool.getConnection();
  let orderId;
  try {
    await conn.beginTransaction();
    const address = await addressService.findOwned(user.id, input.addressId, conn);

    let paymentLabel = 'Transferencia bancaria';
    if (input.paymentType === 'credit') paymentLabel = 'Crédito empresarial';
    if (input.paymentType === 'card') {
      const pm = await paymentService.findOwned(user.id, input.paymentMethodId, conn);
      if (paymentService.isExpired(pm)) throw ApiError.validation([{ field: 'paymentMethodId', code: 'CARD_EXPIRED' }]);
      paymentLabel = paymentService.label(pm);
    }

    const fromCart = !input.items;
    let lines = input.items;
    if (fromCart) {
      const [cart] = await conn.query('SELECT product_id AS productId, quantity FROM cart_items WHERE user_id = ? FOR UPDATE', [user.id]);
      lines = cart;
    }
    if (!lines.length) throw ApiError.conflict('CART_EMPTY', 'El carrito está vacío.');

    const ids = lines.map((l) => l.productId);
    const [products] = await conn.query(
      `SELECT p.id, p.name, p.reference, p.price, p.stock, p.is_active, c.name AS category_name, c.is_active AS category_is_active
       FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id IN (?) FOR UPDATE`,
      [ids],
    );
    const byId = new Map(products.map((p) => [p.id, p]));
    const problems = [];
    for (const l of lines) {
      const p = byId.get(l.productId);
      if (!p || !p.is_active || !p.category_is_active) problems.push({ productId: l.productId, code: 'PRODUCT_UNAVAILABLE' });
      else if (l.quantity > p.stock) problems.push({ productId: l.productId, code: 'INSUFFICIENT_STOCK', available: p.stock, name: p.name });
    }
    if (problems.length) {
      const stock = problems.every((p) => p.code === 'INSUFFICIENT_STOCK');
      throw ApiError.conflict(stock ? 'INSUFFICIENT_STOCK' : 'PRODUCT_UNAVAILABLE', 'Algunos productos no están disponibles en la cantidad pedida.', problems);
    }

    const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
    const subtotal = round2(lines.reduce((s, l) => s + Number(byId.get(l.productId).price) * l.quantity, 0));
    const discountPercent = isCompany ? volumeDiscountPercent(itemCount) : 0;
    const discount = round2((subtotal * discountPercent) / 100);
    const total = round2(subtotal - discount);

    let company = null;
    const onAccount = isCompany && input.paymentType !== 'card';
    if (isCompany) {
      const [[c]] = await conn.query('SELECT * FROM companies WHERE id = ? FOR UPDATE', [user.companyId]);
      if (!c || !c.is_active) throw ApiError.forbidden('COMPANY_INACTIVE', 'La cuenta empresarial no está activa.');
      company = c;
      if (onAccount && Number(c.credit_used) + total > Number(c.credit_limit)) {
        throw ApiError.conflict('CREDIT_LIMIT_EXCEEDED', 'El pedido supera el crédito disponible.', [
          { field: 'paymentType', available: round2(Number(c.credit_limit) - Number(c.credit_used)) },
        ]);
      }
    }

    const status = input.paymentType === 'transfer' ? 'pending' : 'processing';
    const [res] = await conn.query(
      `INSERT INTO orders (user_id, company_id, status, item_count, subtotal, discount_percent, discount, total,
                           payment_type, payment_label, shipping_address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, company ? company.id : null, status, itemCount, subtotal, discountPercent, discount, total,
        input.paymentType, paymentLabel, addressService.formatAddress(address), input.notes ?? null],
    );
    orderId = res.insertId;
    await conn.query("UPDATE orders SET code = CONCAT('Z-', LPAD(id, 4, '0')) WHERE id = ?", [orderId]);
    for (const l of lines) {
      const p = byId.get(l.productId);
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, p.id, p.name, p.reference, p.category_name, p.price, l.quantity, round2(Number(p.price) * l.quantity)],
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [l.quantity, p.id]);
    }
    if (company) {
      const paid = !onAccount;
      const [inv] = await conn.query(
        `INSERT INTO invoices (order_id, company_id, amount, status, issued_at, due_at, paid_at)
         VALUES (?, ?, ?, ?, CURDATE(), CURDATE() + INTERVAL 30 DAY, ?)`,
        [orderId, company.id, total, paid ? 'paid' : 'pending', paid ? new Date() : null],
      );
      await conn.query("UPDATE invoices SET code = CONCAT('FAC-', YEAR(issued_at), '-', LPAD(id, 4, '0')) WHERE id = ?", [inv.insertId]);
      await conn.query('UPDATE companies SET points = points + ?, credit_used = credit_used + ? WHERE id = ?', [
        Math.floor(total / 10),
        onAccount ? total : 0,
        company.id,
      ]);
    }
    if (fromCart) await conn.query('DELETE FROM cart_items WHERE user_id = ?', [user.id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return getById(orderId);
}

/** Cancela: repone existencias y anula la factura pendiente (libera crédito). */
async function applyStatus(orderId, nextStatus, { userId, admin = false } = {}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[o]] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (!o || (userId && o.user_id !== userId)) throw ApiError.notFound('ORDER_NOT_FOUND', 'El pedido no existe.');
    const allowed = admin ? TRANSITIONS[o.status] : ['pending', 'processing'].includes(o.status) ? ['cancelled'] : [];
    if (!allowed.includes(nextStatus)) {
      throw ApiError.conflict('INVALID_STATUS_TRANSITION', 'No se puede cambiar el pedido a ese estado.', [{ from: o.status, to: nextStatus }]);
    }
    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [nextStatus, orderId]);
    if (nextStatus === 'cancelled') {
      const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
      for (const it of items) await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [it.quantity, it.product_id]);
      const [[inv]] = await conn.query("SELECT * FROM invoices WHERE order_id = ? AND status IN ('pending','overdue') FOR UPDATE", [orderId]);
      if (inv) {
        await conn.query("UPDATE invoices SET status = 'cancelled' WHERE id = ?", [inv.id]);
        await conn.query('UPDATE companies SET credit_used = GREATEST(credit_used - ?, 0) WHERE id = ?', [inv.amount, inv.company_id]);
      }
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return getById(orderId);
}

module.exports = { list, getById, create, applyStatus, TRANSITIONS };
