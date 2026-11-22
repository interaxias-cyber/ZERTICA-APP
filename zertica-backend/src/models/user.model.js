'use strict';

const { pool } = require('../config/db');
const { escapeLike } = require('./product.model');

const PUBLIC_COLUMNS = 'id, username, full_name, email, role, language, is_active, created_at, updated_at';

async function findById(id) {
  const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function findByIdWithHash(id) {
  const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function findByUsernameWithHash(username) {
  const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE username = ?`, [username]);
  return rows[0] || null;
}

async function findByEmailWithHash(email) {
  const [rows] = await pool.query(`SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = ?`, [email]);
  return rows[0] || null;
}

async function existsUsername(username, excludeId) {
  const [rows] = await pool.query('SELECT id FROM users WHERE username = ? AND id <> ?', [username, excludeId || 0]);
  return rows.length > 0;
}

async function existsEmail(email, excludeId) {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, excludeId || 0]);
  return rows.length > 0;
}

async function create({ username, fullName, email, passwordHash, language }) {
  const [result] = await pool.query(
    `INSERT INTO users (username, full_name, email, password_hash, role, language, is_active)
     VALUES (?, ?, ?, ?, 'user', ?, 1)`,
    [username, fullName, email, passwordHash, language],
  );
  return result.insertId;
}

async function updateProfile(id, { fullName, email, language }) {
  const sets = [];
  const params = [];
  if (fullName !== undefined) { sets.push('full_name = ?'); params.push(fullName); }
  if (email !== undefined) { sets.push('email = ?'); params.push(email); }
  if (language !== undefined) { sets.push('language = ?'); params.push(language); }
  if (sets.length === 0) return;
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
}

async function updatePasswordHash(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
}

async function setActive(id, isActive) {
  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
}

function buildFilters({ search, role, status }) {
  const clauses = [];
  const params = [];
  if (search) {
    const like = `%${escapeLike(search)}%`;
    clauses.push("(username LIKE ? ESCAPE '\\\\' OR full_name LIKE ? ESCAPE '\\\\' OR email LIKE ? ESCAPE '\\\\')");
    params.push(like, like, like);
  }
  if (role) { clauses.push('role = ?'); params.push(role); }
  if (status === 'active') clauses.push('is_active = 1');
  if (status === 'inactive') clauses.push('is_active = 0');
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

async function findAll(filters, { limit, offset }) {
  const { where, params } = buildFilters(filters);
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users ${where} ORDER BY username ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return rows;
}

async function count(filters) {
  const { where, params } = buildFilters(filters);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
  return Number(rows[0].total);
}

module.exports = {
  findById,
  findByIdWithHash,
  findByUsernameWithHash,
  findByEmailWithHash,
  existsUsername,
  existsEmail,
  create,
  updateProfile,
  updatePasswordHash,
  setActive,
  findAll,
  count,
};
