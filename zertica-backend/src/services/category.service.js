'use strict';

const ApiError = require('../utils/ApiError');
const categoryModel = require('../models/category.model');
const { toCategoryDto } = require('./dto');

/** CU-12: categorías activas con las que se organiza el catálogo. */
async function listActive() {
  const rows = await categoryModel.findActive();
  return { data: rows.map((r) => toCategoryDto(r)) };
}

async function adminList() {
  const rows = await categoryModel.findAll();
  return { data: rows.map((r) => toCategoryDto(r, { admin: true })) };
}

async function adminGet(id) {
  const row = await categoryModel.findById(id);
  if (!row) throw ApiError.notFound('CATEGORY_NOT_FOUND', 'La categoría no existe.');
  return { data: toCategoryDto(row, { admin: true }) };
}

async function ensureUniqueName(name, excludeId) {
  const existing = await categoryModel.findByName(name);
  if (existing && existing.id !== excludeId) {
    throw ApiError.conflict('CATEGORY_ALREADY_EXISTS', 'Ya existe una categoría con ese nombre.', [
      { field: 'name', code: 'ALREADY_EXISTS' },
    ]);
  }
}

/** CU-22 */
async function create({ name }) {
  await ensureUniqueName(name);
  const id = await categoryModel.create(name);
  return adminGet(id);
}

/** CU-23 */
async function update(id, { name }) {
  await adminGet(id);
  await ensureUniqueName(name, id);
  await categoryModel.updateName(id, name);
  return adminGet(id);
}

/** CU-24 (y reactivación): los productos se conservan (RN12). */
async function setStatus(id, isActive) {
  const { data } = await adminGet(id);
  if (data.isActive === isActive) {
    throw ApiError.conflict(
      isActive ? 'CATEGORY_ALREADY_ACTIVE' : 'CATEGORY_ALREADY_INACTIVE',
      isActive ? 'La categoría ya estaba activa.' : 'La categoría ya estaba desactivada.',
    );
  }
  await categoryModel.setActive(id, isActive);
  return adminGet(id);
}

module.exports = { listActive, adminList, adminGet, create, update, setStatus };
