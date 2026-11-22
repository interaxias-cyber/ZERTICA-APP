'use strict';

const v = require('../validators/product.validator');
const { parseBoolean } = require('../validators/common');
const productService = require('../services/product.service');
const { publicPath, removeFile } = require('../middlewares/upload');

module.exports = {
  /** GET /api/products (CU-09, CU-10, CU-11, CU-13) */
  async list(req, res) {
    res.json(await productService.list(req, v.validateListQuery(req.query)));
  },
  /** GET /api/products/:id (CU-14, CU-15) */
  async detail(req, res) {
    res.json(await productService.getDetail(req, v.validateId(req.params.id)));
  },
  async adminList(req, res) {
    res.json(await productService.adminList(req, v.validateAdminListQuery(req.query)));
  },
  async adminGet(req, res) {
    res.json(await productService.adminGet(req, v.validateId(req.params.id)));
  },
  async create(req, res) {
    const image = publicPath(req.file);
    try {
      const data = v.validateProductBody(req.body || {});
      res.status(201).json(await productService.create(req, data, image));
    } catch (err) {
      removeFile(image);
      throw err;
    }
  },
  async update(req, res) {
    const image = publicPath(req.file);
    try {
      const id = v.validateId(req.params.id);
      const data = v.validateProductBody(req.body || {}, { partial: true });
      const { result, previousImage } = await productService.update(req, id, data, image);
      removeFile(previousImage);
      res.json(result);
    } catch (err) {
      removeFile(image);
      throw err;
    }
  },
  async setStatus(req, res) {
    const id = v.validateId(req.params.id);
    const isActive = parseBoolean((req.body || {}).isActive, 'isActive');
    res.json(await productService.setStatus(req, id, isActive));
  },
};
