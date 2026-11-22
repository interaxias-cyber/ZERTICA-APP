'use strict';

const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { round2 } = require('../utils/money');

async function loadCompany(companyId) {
  const [[c]] = await pool.query('SELECT * FROM companies WHERE id = ?', [companyId]);
  if (!c) throw ApiError.notFound('COMPANY_NOT_FOUND', 'La empresa no existe.');
  return c;
}

/** Marca como vencidas las facturas pendientes con fecha límite pasada. */
async function refreshOverdue(companyId) {
  await pool.query("UPDATE invoices SET status = 'overdue' WHERE company_id = ? AND status = 'pending' AND due_at < CURDATE()", [companyId]);
}

const toCompanyDto = (c) => ({
  id: c.id,
  name: c.name,
  legalName: c.legal_name,
  taxId: c.tax_id,
  taxRegime: c.tax_regime,
  fiscalAddress: c.fiscal_address,
  phone: c.phone,
  email: c.email,
  tier: c.tier,
  creditLimit: Number(c.credit_limit),
  creditUsed: Number(c.credit_used),
  creditAvailable: round2(Number(c.credit_limit) - Number(c.credit_used)),
  points: c.points,
});

/** Pantalla "Mi Empresa": datos, crédito, cifras del mes y actividad reciente. */
async function overview(companyId) {
  await refreshOverdue(companyId);
  const c = await loadCompany(companyId);
  const [[month]] = await pool.query(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS amount FROM orders
     WHERE company_id = ? AND status <> 'cancelled' AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
    [companyId],
  );
  const [[inv]] = await pool.query(
    "SELECT COUNT(*) AS pending FROM invoices WHERE company_id = ? AND status IN ('pending','overdue')",
    [companyId],
  );
  const [orders] = await pool.query(
    'SELECT id, code, status, total, created_at, updated_at FROM orders WHERE company_id = ? ORDER BY updated_at DESC, id DESC LIMIT 3',
    [companyId],
  );
  const [paid] = await pool.query(
    "SELECT code, amount, paid_at FROM invoices WHERE company_id = ? AND status = 'paid' AND paid_at IS NOT NULL ORDER BY paid_at DESC LIMIT 2",
    [companyId],
  );
  const activity = [
    ...orders.map((o) => ({ type: `order_${o.status}`, reference: o.code, amount: Number(o.total), at: o.updated_at, orderId: o.id })),
    ...paid.map((i) => ({ type: 'invoice_paid', reference: i.code, amount: Number(i.amount), at: i.paid_at })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 4);
  return {
    data: {
      company: toCompanyDto(c),
      stats: { ordersThisMonth: Number(month.orders), amountThisMonth: Number(month.amount), pendingInvoices: Number(inv.pending), points: c.points },
      activity,
    },
  };
}

async function invoices(companyId, status) {
  await refreshOverdue(companyId);
  const params = [companyId];
  let where = 'i.company_id = ?';
  if (status === 'unpaid') where += " AND i.status IN ('pending','overdue')";
  else if (status && status !== 'all') {
    where += ' AND i.status = ?';
    params.push(status);
  }
  const [rows] = await pool.query(
    `SELECT i.*, o.code AS order_code FROM invoices i JOIN orders o ON o.id = i.order_id WHERE ${where} ORDER BY i.issued_at DESC, i.id DESC`,
    params,
  );
  const data = rows.map((r) => ({
    id: r.id,
    code: r.code,
    orderId: r.order_id,
    orderCode: r.order_code,
    amount: Number(r.amount),
    status: r.status,
    issuedAt: r.issued_at,
    dueAt: r.due_at,
    paidAt: r.paid_at,
  }));
  const unpaid = data.filter((i) => i.status === 'pending' || i.status === 'overdue');
  return { data, meta: { unpaidCount: unpaid.length, unpaidAmount: round2(unpaid.reduce((s, i) => s + i.amount, 0)) } };
}

/** "Pagar ahora": pago SIMULADO de una factura; libera el crédito usado. */
async function payInvoice(companyId, invoiceId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[inv]] = await conn.query('SELECT * FROM invoices WHERE id = ? AND company_id = ? FOR UPDATE', [invoiceId, companyId]);
    if (!inv) throw ApiError.notFound('INVOICE_NOT_FOUND', 'La factura no existe.');
    if (!['pending', 'overdue'].includes(inv.status)) throw ApiError.conflict('INVOICE_NOT_PAYABLE', 'La factura no está pendiente de pago.');
    await conn.query("UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = ?", [invoiceId]);
    await conn.query('UPDATE companies SET credit_used = GREATEST(credit_used - ?, 0) WHERE id = ?', [inv.amount, companyId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return invoices(companyId);
}

/** Datos para generar el PDF de una factura en la app. */
async function invoiceDetail(companyId, invoiceId) {
  const [[inv]] = await pool.query('SELECT * FROM invoices WHERE id = ? AND company_id = ?', [invoiceId, companyId]);
  if (!inv) throw ApiError.notFound('INVOICE_NOT_FOUND', 'La factura no existe.');
  const c = await loadCompany(companyId);
  const [[o]] = await pool.query('SELECT * FROM orders WHERE id = ?', [inv.order_id]);
  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [inv.order_id]);
  return {
    data: {
      code: inv.code,
      status: inv.status,
      amount: Number(inv.amount),
      issuedAt: inv.issued_at,
      dueAt: inv.due_at,
      paidAt: inv.paid_at,
      company: toCompanyDto(c),
      order: {
        code: o.code,
        subtotal: Number(o.subtotal),
        discountPercent: Number(o.discount_percent),
        discount: Number(o.discount),
        total: Number(o.total),
        shippingAddress: o.shipping_address,
        items: items.map((it) => ({
          name: it.product_name,
          reference: it.reference,
          unitPrice: Number(it.unit_price),
          quantity: it.quantity,
          lineTotal: Number(it.line_total),
        })),
      },
    },
  };
}

async function contacts(companyId) {
  const [rows] = await pool.query('SELECT * FROM account_contacts WHERE company_id = ? ORDER BY sort_order, id', [companyId]);
  return { data: rows.map((r) => ({ id: r.id, fullName: r.full_name, title: r.title, phone: r.phone })) };
}

async function users(companyId) {
  const [rows] = await pool.query(
    'SELECT id, username, full_name, email, is_active FROM users WHERE company_id = ? ORDER BY full_name',
    [companyId],
  );
  return { data: rows.map((r) => ({ id: r.id, username: r.username, fullName: r.full_name, email: r.email, isActive: Boolean(r.is_active) })) };
}

module.exports = { overview, invoices, payInvoice, invoiceDetail, contacts, users };
