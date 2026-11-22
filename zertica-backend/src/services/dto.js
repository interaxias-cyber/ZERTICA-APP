'use strict';

const { absoluteUrl } = require('../utils/url');

/** Contrato documentado de GET /api/products (sección 13). */
function toProductDto(req, row) {
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    description: row.description,
    imageUrl: absoluteUrl(req, row.image_url),
    category: { id: row.category_id, name: row.category_name },
    brand: { id: row.brand_id, name: row.brand_name },
  };
}

/** Versión administrativa: añade estados y fechas. */
function toAdminProductDto(req, row) {
  return {
    ...toProductDto(req, row),
    category: { id: row.category_id, name: row.category_name, isActive: Boolean(row.category_is_active) },
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toFeatureDto(row) {
  return { id: row.id, name: row.name, value: row.value };
}

function toCategoryDto(row, { admin = false } = {}) {
  const dto = { id: row.id, name: row.name, productCount: Number(row.product_count ?? 0) };
  if (admin) {
    dto.isActive = Boolean(row.is_active);
    dto.createdAt = row.created_at;
    dto.updatedAt = row.updated_at;
  }
  return dto;
}

function toBrandDto(row) {
  return { id: row.id, name: row.name };
}

/** Nunca incluye password_hash (CU-26, RNF01). */
function toUserDto(row) {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    language: row.language,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

module.exports = {
  toProductDto,
  toAdminProductDto,
  toFeatureDto,
  toCategoryDto,
  toBrandDto,
  toUserDto,
  toMeta,
};
