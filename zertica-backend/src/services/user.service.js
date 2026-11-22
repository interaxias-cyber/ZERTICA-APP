'use strict';

const ApiError = require('../utils/ApiError');
const userModel = require('../models/user.model');
const authService = require('./auth.service');
const { toUserDto, toMeta } = require('./dto');

/** CU-06 */
async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'Usuario no encontrado.');
  return { data: toUserDto(user) };
}

/** CU-07 y RF09 (idioma) */
async function updateProfile(userId, data) {
  if (data.email) await authService.ensureUnique({ email: data.email }, userId);
  await userModel.updateProfile(userId, data);
  return getProfile(userId);
}

/** CU-25 */
async function adminList({ page, limit, search, role, status }) {
  const offset = (page - 1) * limit;
  const filters = { search, role, status };
  const [rows, total] = await Promise.all([
    userModel.findAll(filters, { limit, offset }),
    userModel.count(filters),
  ]);
  return { data: rows.map(toUserDto), meta: toMeta(page, limit, total) };
}

/** CU-26 */
async function adminGet(id) {
  const user = await userModel.findById(id);
  if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'El usuario no existe.');
  return { data: toUserDto(user) };
}

/** CU-27. Decisión pendiente 15 → propuesta: el administrador no puede desactivarse a sí mismo. */
async function setStatus(actorId, id, isActive) {
  if (actorId === id && !isActive) {
    throw ApiError.badRequest('CANNOT_DEACTIVATE_SELF', 'No puede desactivar su propia cuenta.');
  }
  const { data } = await adminGet(id);
  if (data.isActive === isActive) {
    throw ApiError.conflict(
      isActive ? 'USER_ALREADY_ACTIVE' : 'USER_ALREADY_INACTIVE',
      isActive ? 'La cuenta ya estaba activa.' : 'La cuenta ya estaba desactivada.',
    );
  }
  await userModel.setActive(id, isActive);
  return adminGet(id);
}

module.exports = { getProfile, updateProfile, adminList, adminGet, setStatus };
