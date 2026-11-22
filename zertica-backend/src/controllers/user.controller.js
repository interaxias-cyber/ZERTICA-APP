'use strict';

const ApiError = require('../utils/ApiError');
const { parsePagination, parseSearch, parseBoolean } = require('../validators/common');
const { validateId } = require('../validators/product.validator');
const userService = require('../services/user.service');

module.exports = {
  async list(req, res) {
    const { role, status } = req.query;
    if (role !== undefined && role !== '' && !['user', 'admin'].includes(role)) {
      throw ApiError.badRequest('INVALID_PARAMETER', 'El parámetro "role" debe ser user o admin.', { field: 'role' });
    }
    if (status !== undefined && status !== '' && !['all', 'active', 'inactive'].includes(status)) {
      throw ApiError.badRequest('INVALID_PARAMETER', 'El parámetro "status" debe ser all, active o inactive.', { field: 'status' });
    }
    res.json(await userService.adminList({
      ...parsePagination(req.query),
      search: parseSearch(req.query.search),
      role: role || undefined,
      status: status || 'all',
    }));
  },
  async detail(req, res) {
    res.json(await userService.adminGet(validateId(req.params.id)));
  },
  async setStatus(req, res) {
    const isActive = parseBoolean((req.body || {}).isActive, 'isActive');
    res.json(await userService.setStatus(req.user.id, validateId(req.params.id), isActive));
  },
};
