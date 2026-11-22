'use strict';

const { pool } = require('../config/db');
const userModel = require('../models/user.model');

const n = (v) => Number(v || 0);

/**
 * Resumen del panel administrativo (pantalla "Dashboard" del diseño).
 * Solo cuenta registros de las 5 tablas: no hay ventas ni pedidos en el MVP.
 */
async function getSummary() {
  const [[products]] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(is_active = 1), 0) AS active, COALESCE(SUM(is_active = 0), 0) AS inactive,
            COALESCE(SUM(image_url IS NULL), 0) AS without_image
     FROM products`,
  );
  const [[categories]] = await pool.query(
    'SELECT COUNT(*) AS total, COALESCE(SUM(is_active = 1), 0) AS active, COALESCE(SUM(is_active = 0), 0) AS inactive FROM categories',
  );
  const [[brands]] = await pool.query('SELECT COUNT(*) AS total FROM brands');
  const users = await userModel.summary();
  return {
    data: {
      products: { total: n(products.total), active: n(products.active), inactive: n(products.inactive), withoutImage: n(products.without_image) },
      categories: { total: n(categories.total), active: n(categories.active), inactive: n(categories.inactive) },
      brands: { total: n(brands.total) },
      users: { total: n(users.total), active: n(users.active), inactive: n(users.inactive), admins: n(users.admins) },
    },
  };
}

module.exports = { getSummary };
