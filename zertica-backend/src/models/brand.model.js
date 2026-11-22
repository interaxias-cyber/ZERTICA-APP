'use strict';

const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.query('SELECT id, name FROM brands ORDER BY name ASC');
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT id, name FROM brands WHERE id = ?', [id]);
  return rows[0] || null;
}

module.exports = { findAll, findById };
