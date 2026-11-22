'use strict';

const ApiError = require('../utils/ApiError');
const productModel = require('../models/product.model');
const categoryModel = require('../models/category.model');
const brandModel = require('../models/brand.model');
const { toProductDto, toAdminProductDto, toFeatureDto, toMeta } = require('./dto');

/** GET /api/products — devuelve { data, meta } (contrato documentado). */
async function list(req, { page, limit, search, categoryId, brandId }) {
  const offset = (page - 1) * limit;
  const filters = { search, categoryId, brandId };
  const [rows, total] = await Promise.all([
    productModel.findAll(filters, { limit, offset }),
    productModel.count(filters),
  ]);
  return { data: rows.map((r) => toProductDto(req, r)), meta: toMeta(page, limit, total) };
}

/** CU-14 / CU-15: producto inexistente, desactivado o de categoría desactivada → 404. */
async function getDetail(req, id) {
  const row = await productModel.findById(id);
  if (!row || !row.is_active || !row.category_is_active) {
    throw ApiError.notFound('PRODUCT_NOT_FOUND', 'El producto no existe o no está disponible.');
  }
  const features = await productModel.findFeatures(id);
  return { data: { ...toProductDto(req, row), features: features.map(toFeatureDto) } };
}

/** CU-16: listado administrativo con productos activos y desactivados. */
async function adminList(req, { page, limit, search, categoryId, brandId, status }) {
  const offset = (page - 1) * limit;
  const filters = { search, categoryId, brandId, status };
  const [rows, total] = await Promise.all([
    productModel.findAll(filters, { limit, offset }, 'admin'),
    productModel.count(filters, 'admin'),
  ]);
  return { data: rows.map((r) => toAdminProductDto(req, r)), meta: toMeta(page, limit, total) };
}

async function adminGet(req, id) {
  const row = await productModel.findById(id);
  if (!row) throw ApiError.notFound('PRODUCT_NOT_FOUND', 'El producto no existe.');
  const features = await productModel.findFeatures(id);
  return { data: { ...toAdminProductDto(req, row), features: features.map(toFeatureDto) } };
}

async function checkReferences({ reference, categoryId, brandId }, excludeId) {
  const details = [];
  if (reference) {
    const existing = await productModel.findByReference(reference);
    if (existing && existing.id !== excludeId) details.push({ field: 'reference', code: 'ALREADY_EXISTS' });
  }
  if (categoryId && !(await categoryModel.findById(categoryId))) {
    details.push({ field: 'category_id', code: 'NOT_FOUND' });
  }
  if (brandId && !(await brandModel.findById(brandId))) {
    details.push({ field: 'brand_id', code: 'NOT_FOUND' });
  }
  if (details.some((d) => d.code === 'ALREADY_EXISTS')) {
    throw ApiError.conflict('REFERENCE_ALREADY_EXISTS', 'Ya existe un producto con esa referencia.', details);
  }
  if (details.length > 0) throw ApiError.validation(details);
}

/** CU-17 + CU-21: la imagen es obligatoria al crear (RN11). */
async function create(req, data, imagePath) {
  if (!imagePath) throw ApiError.validation([{ field: 'image', code: 'REQUIRED' }]);
  await checkReferences(data);
  const id = await productModel.create({ ...data, imageUrl: imagePath });
  return adminGet(req, id);
}

/** CU-18 + CU-21: imagen opcional al editar. Devuelve la ruta de la imagen previa. */
async function update(req, id, data, imagePath) {
  const current = await productModel.findById(id);
  if (!current) throw ApiError.notFound('PRODUCT_NOT_FOUND', 'El producto no existe.');
  await checkReferences(data, id);
  await productModel.update(id, { ...data, ...(imagePath ? { imageUrl: imagePath } : {}) });
  return { result: await adminGet(req, id), previousImage: imagePath ? current.image_url : null };
}

/** CU-19 / CU-20 */
async function setStatus(req, id, isActive) {
  const current = await productModel.findById(id);
  if (!current) throw ApiError.notFound('PRODUCT_NOT_FOUND', 'El producto no existe.');
  if (Boolean(current.is_active) === isActive) {
    throw ApiError.conflict(
      isActive ? 'PRODUCT_ALREADY_ACTIVE' : 'PRODUCT_ALREADY_INACTIVE',
      isActive ? 'El producto ya estaba activo.' : 'El producto ya estaba desactivado.',
    );
  }
  await productModel.setActive(id, isActive);
  const result = await adminGet(req, id);
  // CU-20 alternativo: si la categoría está desactivada, sigue oculto en el catálogo.
  if (isActive && !current.category_is_active) {
    result.warning = { code: 'CATEGORY_INACTIVE', message: 'La categoría está desactivada: el producto seguirá oculto en el catálogo.' };
  }
  return result;
}

module.exports = { list, getDetail, adminList, adminGet, create, update, setStatus };
