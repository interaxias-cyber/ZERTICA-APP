'use strict';

const { parsePositiveInt, parseSearch, parsePagination, FieldErrors, str } = require('./common');
const ApiError = require('../utils/ApiError');

/** GET /api/products — contrato documentado (page, limit, search, category_id, brand_id). */
function validateListQuery(query) {
  return {
    ...parsePagination(query),
    search: parseSearch(query.search),
    categoryId: parsePositiveInt(query.category_id, 'category_id'),
    brandId: parsePositiveInt(query.brand_id, 'brand_id'),
  };
}

/** GET /api/admin/products — añade el filtro de estado (active | inactive | all). */
function validateAdminListQuery(query) {
  const base = validateListQuery(query);
  const status = query.status === undefined || query.status === '' ? 'all' : String(query.status);
  if (!['all', 'active', 'inactive'].includes(status)) {
    throw ApiError.badRequest('INVALID_PARAMETER', 'El parámetro "status" debe ser all, active o inactive.', { field: 'status' });
  }
  return { ...base, status };
}

function validateId(value, field = 'id') {
  return parsePositiveInt(value, field);
}

/**
 * Valida el cuerpo de alta/edición de producto (CU-17, CU-18).
 * `partial` = edición: los campos son opcionales pero, si llegan, se validan.
 */
function validateProductBody(body, { partial = false } = {}) {
  const errors = new FieldErrors();
  const out = {};

  const fields = {
    reference: { max: 50, re: /^[A-Za-z0-9._\-/ ]+$/ },
    name: { max: 150 },
    description: { max: 2000, optional: true },
  };

  for (const [field, rules] of Object.entries(fields)) {
    if (partial && body[field] === undefined) continue;
    const value = str(body[field]);
    if (!value) {
      if (!rules.optional) errors.add(field, 'REQUIRED');
      else out[field] = null;
      continue;
    }
    if (value.length > rules.max) errors.add(field, 'TOO_LONG');
    else if (rules.re && !rules.re.test(value)) errors.add(field, 'INVALID_FORMAT');
    else out[field] = field === 'reference' ? value.toUpperCase() : value;
  }

  for (const [field, key] of [['category_id', 'categoryId'], ['brand_id', 'brandId']]) {
    const raw = body[field] ?? body[key];
    if (partial && raw === undefined) continue;
    if (raw === undefined || raw === null || raw === '') {
      errors.add(field, 'REQUIRED');
      continue;
    }
    if (!/^\d+$/.test(String(raw)) || Number(raw) < 1) errors.add(field, 'INVALID_ID');
    else out[key] = Number(raw);
  }

  // v2: precio (≥ 0, 2 decimales) y existencias (entero ≥ 0).
  if (!(partial && body.price === undefined)) {
    const raw = str(body.price);
    if (raw === '') {
      if (!partial) out.price = 0;
    } else if (!/^\d{1,9}(\.\d{1,2})?$/.test(raw)) errors.add('price', 'INVALID_PRICE');
    else out.price = Number(raw);
  }
  if (!(partial && body.stock === undefined)) {
    const raw = str(body.stock);
    if (raw === '') {
      if (!partial) out.stock = 0;
    } else if (!/^\d{1,9}$/.test(raw)) errors.add('stock', 'INVALID_STOCK');
    else out.stock = Number(raw);
  }

  errors.throwIfAny();
  return out;
}

module.exports = { validateListQuery, validateAdminListQuery, validateId, validateProductBody };
