'use strict';

const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');

const MAX_ADDRESSES = 10;

const toDto = (r) => ({
  id: r.id,
  label: r.label,
  line1: r.line1,
  city: r.city,
  postalCode: r.postal_code,
  isDefault: Boolean(r.is_default),
});

async function list(userId) {
  const [rows] = await pool.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC', [userId]);
  return rows.map(toDto);
}

async function findOwned(userId, id, conn = pool) {
  const [rows] = await conn.query('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
  if (!rows[0]) throw ApiError.notFound('ADDRESS_NOT_FOUND', 'La dirección no existe.');
  return rows[0];
}

async function create(userId, data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ? FOR UPDATE', [userId]);
    if (n >= MAX_ADDRESSES) throw ApiError.conflict('ADDRESS_LIMIT', `Máximo ${MAX_ADDRESSES} direcciones.`);
    const isDefault = n === 0 || data.isDefault === true;
    if (isDefault) await conn.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    const [r] = await conn.query(
      'INSERT INTO addresses (user_id, label, line1, city, postal_code, is_default) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, data.label, data.line1, data.city, data.postalCode ?? null, isDefault ? 1 : 0],
    );
    await conn.commit();
    return toDto(await findOwned(userId, r.insertId));
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function update(userId, id, data) {
  await findOwned(userId, id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (data.isDefault === true) await conn.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    const map = { label: 'label', line1: 'line1', city: 'city', postalCode: 'postal_code' };
    const sets = [];
    const params = [];
    for (const [k, col] of Object.entries(map)) {
      if (data[k] !== undefined) {
        sets.push(`${col} = ?`);
        params.push(data[k]);
      }
    }
    if (data.isDefault === true) sets.push('is_default = 1');
    if (sets.length) await conn.query(`UPDATE addresses SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return toDto(await findOwned(userId, id));
}

async function remove(userId, id) {
  const row = await findOwned(userId, id);
  await pool.query('DELETE FROM addresses WHERE id = ?', [id]);
  if (row.is_default) {
    await pool.query('UPDATE addresses SET is_default = 1 WHERE user_id = ? ORDER BY id LIMIT 1', [userId]);
  }
}

const formatAddress = (a) => `${a.label} · ${a.line1}, ${a.city}${a.postal_code ? ` ${a.postal_code}` : ''}`;

module.exports = { list, create, update, remove, findOwned, formatAddress };
