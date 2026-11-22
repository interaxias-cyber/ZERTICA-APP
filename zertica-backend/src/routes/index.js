'use strict';

const router = require('express').Router();
const h = require('../utils/asyncHandler');
const { testConnection } = require('../config/db');
const { authenticate, authorize } = require('../middlewares/auth');
const catalog = require('../controllers/catalog.controller');

// RNF11: 200 si la base responde, 503 si no.
router.get('/health', async (req, res) => {
  try {
    await testConnection();
    res.json({ status: 'ok', database: 'up' });
  } catch {
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

// Bloque de acceso: público (visitante).
router.use('/auth', require('./auth.routes'));

// Todo lo demás exige sesión activa (RN01, decisión pendiente 5).
router.use('/me', authenticate, require('./profile.routes'));
router.use('/products', authenticate, require('./product.routes'));
router.get('/categories', authenticate, h(catalog.categories));
router.get('/brands', authenticate, h(catalog.brands));

// Ampliación v2 (pantallas de Figma fuera del MVP original).
const commerce = require('./commerce.routes');
router.use('/cart', authenticate, commerce.cartRouter);
router.use('/orders', authenticate, commerce.orderRouter);
router.use('/addresses', authenticate, commerce.addressRouter);
router.use('/payment-methods', authenticate, commerce.paymentRouter);
router.use('/support', authenticate, commerce.supportRouter);
router.use('/company', authenticate, commerce.companyRouter);

// Administración: solo rol admin (RN06).
router.use('/admin', authenticate, authorize('admin'), require('./admin.routes'));

module.exports = router;
