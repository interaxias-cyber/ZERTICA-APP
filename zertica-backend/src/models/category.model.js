'use strict';

const { pool } = require('../config/db');

async function findActive() {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.is_active,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
     FROM categories c WHERE c.is_active = 1 ORDER BY c.name ASC`,
  );
  return rows;
}

async function findAll() {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.is_active, c.created_at, c.updated_at,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
     FROM categories c ORDER BY c.name ASC`,
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.is_active, c.created_at, c.updated_at,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
     FROM categories c WHERE c.id = ?`,
    [id],
  );
  return rows[0] || null;
}

async function findByName(name) {
  const [rows] = await pool.query('SELECT id FROM categories WHERE name = ?', [name]);
  return rows[0] || null;
}

async function create(name) {
  const [result] = await pool.query('INSERT INTO categories (name, is_active) VALUES (?, 1)', [name]);
  return result.insertId;
}

async function updateName(id, name) {
  await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
}

async function setActive(id, isActive) {
  await pool.query('UPDATE categories SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
}

module.exports = { findActive, findAll, findById, findByName, create, updateName, setActive };
