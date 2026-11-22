'use strict';

const ApiError = require('../utils/ApiError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[A-Za-z0-9._-]{3,50}$/;
// Diseño de Figma (pantalla Seguridad): al menos 8 caracteres, una letra
// mayúscula, un número y un carácter especial.
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

function parsePositiveInt(value, field, { defaultValue, max } = {}) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const str = String(value).trim();
  if (!/^\d+$/.test(str) || Number(str) < 1) {
    throw ApiError.badRequest('INVALID_PARAMETER', `El parámetro "${field}" debe ser un entero positivo.`, { field });
  }
  const n = Number(str);
  if (max !== undefined && n > max) {
    throw ApiError.badRequest('INVALID_PARAMETER', `El parámetro "${field}" no puede ser mayor que ${max}.`, { field, max });
  }
  return n;
}

function parseSearch(value) {
  if (value === undefined || value === null) return undefined;
  const search = String(value).trim();
  if (search.length > 100) {
    throw ApiError.badRequest('INVALID_PARAMETER', 'El parámetro "search" admite máximo 100 caracteres.', { field: 'search', max: 100 });
  }
  return search === '' ? undefined : search;
}

function parsePagination(query) {
  return {
    page: parsePositiveInt(query.page, 'page', { defaultValue: 1 }),
    limit: parsePositiveInt(query.limit, 'limit', { defaultValue: 20, max: 100 }),
  };
}

/** Acumula errores de campo y lanza VALIDATION_ERROR si hay alguno. */
class FieldErrors {
  constructor() {
    this.errors = [];
  }

  add(field, code) {
    this.errors.push({ field, code });
  }

  throwIfAny() {
    if (this.errors.length > 0) throw ApiError.validation(this.errors);
  }
}

function str(value) {
  return typeof value === 'string' ? value.trim() : value === undefined || value === null ? '' : String(value).trim();
}

function parseBoolean(value, field) {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  throw ApiError.validation([{ field, code: 'INVALID_BOOLEAN' }]);
}

module.exports = {
  EMAIL_RE,
  USERNAME_RE,
  PASSWORD_RE,
  parsePositiveInt,
  parseSearch,
  parsePagination,
  parseBoolean,
  FieldErrors,
  str,
};
