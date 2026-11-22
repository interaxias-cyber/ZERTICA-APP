'use strict';

const router = require('express').Router();
const h = require('../utils/asyncHandler');
const products = require('../controllers/product.controller');
const catalog = require('../controllers/catalog.controller');
const users = require('../controllers/user.controller');
const { productImage } = require('../middlewares/upload');
const { getSummary } = require('../services/summary.service');

// Resumen del panel (conteos de las 5 tablas).
router.get('/summary', h(async (req, res) => res.json(await getSummary())));

// D · Gestión de productos (CU-16 a CU-21)
router.get('/products', h(products.adminList));
router.get('/products/:id', h(products.adminGet));
router.post('/products', productImage, h(products.create));
router.put('/products/:id', productImage, h(products.update));
router.patch('/products/:id/status', h(products.setStatus));

// E · Gestión de categorías (CU-22 a CU-24)
router.get('/categories', h(catalog.adminCategories));
router.get('/categories/:id', h(catalog.adminCategory));
router.post('/categories', h(catalog.createCategory));
router.put('/categories/:id', h(catalog.updateCategory));
router.patch('/categories/:id/status', h(catalog.setCategoryStatus));

// F · Gestión de usuarios (CU-25 a CU-27)
router.get('/users', h(users.list));
router.get('/users/:id', h(users.detail));
router.patch('/users/:id/status', h(users.setStatus));

// v2 · Pedidos (pantalla "Pedidos" del panel) y reportes de ventas.
const orders = require('../services/order.service');
const reports = require('../services/report.service');
const { parsePagination, parseSearch } = require('../validators/common');
const { validateId } = require('../validators/product.validator');
const { validateOrderStatus, validateMonth } = require('../validators/commerce.validator');
const { parseOrderStatus } = require('./commerce.routes');

router.get('/orders', h(async (req, res) =>
  res.json(await orders.list({ status: parseOrderStatus(req.query.status), search: parseSearch(req.query.search), ...parsePagination(req.query) }))));
router.get('/orders/:id', h(async (req, res) => res.json(await orders.getById(validateId(req.params.id)))));
router.patch('/orders/:id/status', h(async (req, res) =>
  res.json(await orders.applyStatus(validateId(req.params.id), validateOrderStatus(req.body || {}), { admin: true }))));
router.get('/reports', h(async (req, res) => res.json(await reports.monthly(validateMonth(req.query.month)))));
router.get('/reports/export.csv', h(async (req, res) => {
  const month = validateMonth(req.query.month);
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="zertica-ventas-${month}.csv"`);
  res.send(await reports.csv(month));
}));

module.exports = router;
