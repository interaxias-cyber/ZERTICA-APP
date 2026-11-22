'use strict';

const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');

const BRAND = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', other: 'Tarjeta' };

function isExpired(r, now = new Date()) {
  return new Date(r.exp_year, r.exp_month, 1) <= now;
}

const toDto = (r) => ({
  id: r.id,
  brand: r.brand,
  brandName: BRAND[r.brand],
  last4: r.last4,
  expMonth: r.exp_month,
  expYear: r.exp_year,
  holderName: r.holder_name,
  isDefault: Boolean(r.is_default),
  isExpired: isExpired(r),
});

const label = (r) => `${BRAND[r.brand]} •••• ${r.last4}`;

async function list(userId) {
  const [rows] = await pool.query('SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, id ASC', [userId]);
  return rows.map(toDto);
}

async function create(userId, card) {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM payment_methods WHERE user_id = ?', [userId]);
  if (n >= 5) throw ApiError.conflict('PAYMENT_METHOD_LIMIT', 'Máximo 5 tarjetas.');
  const [dup] = await pool.query(
    'SELECT id FROM payment_methods WHERE user_id = ? AND brand = ? AND last4 = ? AND exp_month = ? AND exp_year = ?',
    [userId, card.brand, card.last4, card.expMonth, card.expYear],
  );
  if (dup.length) throw ApiError.conflict('PAYMENT_METHOD_EXISTS', 'La tarjeta ya está registrada.');
  const [r] = await pool.query(
    'INSERT INTO payment_methods (user_id, brand, last4, exp_month, exp_year, holder_name, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, card.brand, card.last4, card.expMonth, card.expYear, card.holderName, n === 0 ? 1 : 0],
  );
  const [rows] = await pool.query('SELECT * FROM payment_methods WHERE id = ?', [r.insertId]);
  return toDto(rows[0]);
}

async function findOwned(userId, id, conn = pool) {
  const [rows] = await conn.query('SELECT * FROM payment_methods WHERE id = ? AND user_id = ?', [id, userId]);
  if (!rows[0]) throw ApiError.notFound('PAYMENT_METHOD_NOT_FOUND', 'El método de pago no existe.');
  return rows[0];
}

async function remove(userId, id) {
  const row = await findOwned(userId, id);
  await pool.query('DELETE FROM payment_methods WHERE id = ?', [id]);
  if (row.is_default) {
    await pool.query('UPDATE payment_methods SET is_default = 1 WHERE user_id = ? ORDER BY id LIMIT 1', [userId]);
  }
}

module.exports = { list, create, remove, findOwned, label, isExpired };
