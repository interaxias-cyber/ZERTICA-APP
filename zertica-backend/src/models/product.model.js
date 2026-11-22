'use strict';

const { pool } = require('../config/db');

/** Escapa los comodines de LIKE para tratarlos como texto (RN15). */
function escapeLike(text) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Construye el WHERE parametrizado.
 * scope 'catalog': solo productos activos de categorías activas (RN08).
 * scope 'admin': todos, con filtro opcional de estado.
 */
function buildFilters({ search, categoryId, brandId, status }, scope = 'catalog') {
  const clauses = [];
  const params = [];

  if (scope === 'catalog') {
    clauses.push('p.is_active = 1', 'c.is_active = 1');
  } else if (status === 'active') {
    clauses.push('p.is_active = 1');
  } else if (status === 'inactive') {
    clauses.push('p.is_active = 0');
  }

  if (search) {
    const like = `%${escapeLike(search)}%`;
    clauses.push("(p.reference LIKE ? ESCAPE '\\\\' OR p.name LIKE ? ESCAPE '\\\\')");
    params.push(like, like);
  }
  if (categoryId) {
    clauses.push('p.category_id = ?');
    params.push(categoryId);
  }
  if (brandId) {
    clauses.push('p.brand_id = ?');
    params.push(brandId);
  }

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

const SELECT_COLUMNS = `
  p.id, p.reference, p.name, p.description, p.image_url, p.is_active,
  p.created_at, p.updated_at,
  c.id AS category_id, c.name AS category_name, c.is_active AS category_is_active,
  b.id AS brand_id, b.name AS brand_name`;

const FROM_JOIN = `
  FROM products p
  INNER JOIN categories c ON c.id = p.category_id
  INNER JOIN brands b ON b.id = p.brand_id`;

async function findAll(filters, { limit, offset }, scope = 'catalog') {
  const { where, params } = buildFilters(filters, scope);
  const [rows] = await pool.query(
    `SELECT ${SELECT_COLUMNS} ${FROM_JOIN} ${where} ORDER BY p.name ASC, p.id ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  return rows;
}

async function count(filters, scope = 'catalog') {
  const { where, params } = buildFilters(filters, scope);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total ${FROM_JOIN} ${where}`, params);
  return Number(rows[0].total);
}

async function findById(id) {
  const [rows] = await pool.query(`SELECT ${SELECT_COLUMNS} ${FROM_JOIN} WHERE p.id = ?`, [id]);
  return rows[0] || null;
}

async function findFeatures(productId) {
  const [rows] = await pool.query(
    'SELECT id, name, value FROM product_features WHERE product_id = ? ORDER BY id ASC',
    [productId],
  );
  return rows;
}

async function findByReference(reference) {
  const [rows] = await pool.query('SELECT id FROM products WHERE reference = ?', [reference]);
  return rows[0] || null;
}

async function create({ reference, name, description, imageUrl, categoryId, brandId }) {
  const [result] = await pool.query(
    `INSERT INTO products (reference, name, description, image_url, category_id, brand_id, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [reference, name, description ?? null, imageUrl, categoryId, brandId],
  );
  return result.insertId;
}

async function update(id, data) {
  const map = {
    reference: 'reference',
    name: 'name',
    description: 'description',
    imageUrl: 'image_url',
    categoryId: 'category_id',
    brandId: 'brand_id',
  };
  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(map)) {
    if (data[key] !== undefined) {
      sets.push(`${column} = ?`);
      params.push(data[key]);
    }
  }
  if (sets.length === 0) return;
  await pool.query(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
}

async function setActive(id, isActive) {
  await pool.query('UPDATE products SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
}

module.exports = {
  escapeLike,
  buildFilters,
  findAll,
  count,
  findById,
  findFeatures,
  findByReference,
  create,
  update,
  setActive,
};
