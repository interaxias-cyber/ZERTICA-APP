'use strict';

const router = require('express').Router();
const h = require('../utils/asyncHandler');
const products = require('../controllers/product.controller');
const catalog = require('../controllers/catalog.controller');
const users = require('../controllers/user.controller');
const { productImage } = require('../middlewares/upload');

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

module.exports = router;
