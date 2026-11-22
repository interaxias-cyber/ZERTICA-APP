'use strict';

const categoryService = require('../services/category.service');
const brandModel = require('../models/brand.model');
const { toBrandDto } = require('../services/dto');
const { validateId } = require('../validators/product.validator');
const { parseBoolean } = require('../validators/common');
const { validateCategoryBody } = require('../validators/category.validator');

module.exports = {
  async categories(req, res) {
    res.json(await categoryService.listActive());
  },
  async brands(req, res) {
    res.json({ data: (await brandModel.findAll()).map(toBrandDto) });
  },
  async adminCategories(req, res) {
    res.json(await categoryService.adminList());
  },
  async adminCategory(req, res) {
    res.json(await categoryService.adminGet(validateId(req.params.id)));
  },
  async createCategory(req, res) {
    res.status(201).json(await categoryService.create(validateCategoryBody(req.body || {})));
  },
  async updateCategory(req, res) {
    res.json(await categoryService.update(validateId(req.params.id), validateCategoryBody(req.body || {})));
  },
  async setCategoryStatus(req, res) {
    const isActive = parseBoolean((req.body || {}).isActive, 'isActive');
    res.json(await categoryService.setStatus(validateId(req.params.id), isActive));
  },
};
