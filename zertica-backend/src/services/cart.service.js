'use strict';

const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { toProductDto } = require('./dto');
const { round2, volumeDiscountPercent, VOLUME_TIERS } = require('../utils/money');

const MAX_LINES = 100;

async function rawItems(userId) {
  const [rows] = await pool.query(
    `SELECT ci.quantity, p.id, p.reference, p.name, p.description, p.image_url, p.price, p.stock, p.is_active,
            c.id AS category_id, c.name AS category_name, c.is_active AS category_is_active,
            b.id AS brand_id, b.name AS brand_name
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     JOIN categories c ON c.id = p.category_id
     JOIN brands b ON b.id = p.brand_id
     WHERE ci.user_id = ?
     ORDER BY ci.added_at ASC`,
    [userId],
  );
  return rows;
}

/** Totales del carrito; el descuento por volumen solo aplica al rol Empresa. */
function totals(lines, role) {
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  const discountPercent = role === 'company' ? volumeDiscountPercent(itemCount) : 0;
  const discount = round2((subtotal * discountPercent) / 100);
  return { itemCount, subtotal, discountPercent, discount, total: round2(subtotal - discount) };
}

async function get(req) {
  const rows = await rawItems(req.user.id);
  const items = rows.map((r) => {
    const available = Boolean(r.is_active && r.category_is_active);
    return {
      product: toProductDto(req, r),
      quantity: r.quantity,
      lineTotal: round2(Number(r.price) * r.quantity),
      available,
      enoughStock: r.quantity <= r.stock,
    };
  });
  return { data: { items, ...totals(items, req.user.role), volumeTiers: req.user.role === 'company' ? VOLUME_TIERS : [] } };
}

async function assertProduct(productId) {
  const [rows] = await pool.query(
    `SELECT p.id, p.stock, p.is_active, c.is_active AS category_is_active
     FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
    [productId],
  );
  const p = rows[0];
  if (!p || !p.is_active || !p.category_is_active) {
    throw ApiError.notFound('PRODUCT_NOT_FOUND', 'El producto no existe o no está disponible.');
  }
  return p;
}

/** Agrega (suma) unidades de un producto. */
async function add(req, productId, quantity) {
  const p = await assertProduct(productId);
  const [[current]] = await pool.query(
    'SELECT COALESCE(SUM(quantity), 0) AS q, (SELECT COUNT(*) FROM cart_items WHERE user_id = ?) AS line_count FROM cart_items WHERE user_id = ? AND product_id = ?',
    [req.user.id, req.user.id, productId],
  );
  const next = Number(current.q) + quantity;
  if (Number(current.q) === 0 && current.line_count >= MAX_LINES) throw ApiError.conflict('CART_FULL', 'El carrito está lleno.');
  if (next > p.stock) {
    throw ApiError.conflict('INSUFFICIENT_STOCK', 'No hay existencias suficientes.', [{ productId, available: p.stock }]);
  }
  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
    [req.user.id, productId, next],
  );
  return get(req);
}

/** Fija la cantidad de un producto (0 = quitar). */
async function setQuantity(req, productId, quantity) {
  if (quantity === 0) return remove(req, productId);
  const p = await assertProduct(productId);
  if (quantity > p.stock) {
    throw ApiError.conflict('INSUFFICIENT_STOCK', 'No hay existencias suficientes.', [{ productId, available: p.stock }]);
  }
  const [r] = await pool.query('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [quantity, req.user.id, productId]);
  if (r.affectedRows === 0) throw ApiError.notFound('CART_ITEM_NOT_FOUND', 'El producto no está en el carrito.');
  return get(req);
}

async function remove(req, productId) {
  await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
  return get(req);
}

async function clear(req) {
  await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
  return get(req);
}

module.exports = { get, add, setQuantity, remove, clear, totals };
