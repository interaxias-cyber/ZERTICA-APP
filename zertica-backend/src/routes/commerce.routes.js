'use strict';

/**
 * Rutas de la ampliación v2: carrito, pedidos, direcciones, métodos de pago,
 * ayuda y cuenta Empresa. Cada recurso pertenece al usuario autenticado.
 */
const express = require('express');
const h = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { pool } = require('../config/db');
const { authorize } = require('../middlewares/auth');
const { parsePagination, parseSearch } = require('../validators/common');
const { validateId } = require('../validators/product.validator');
const v = require('../validators/commerce.validator');
const cart = require('../services/cart.service');
const orders = require('../services/order.service');
const addresses = require('../services/address.service');
const payments = require('../services/payment.service');
const company = require('../services/company.service');

function parseOrderStatus(value) {
  if (value === undefined || value === '' || value === 'all') return 'all';
  if (value === 'active' || v.ORDER_STATUSES.includes(value)) return value;
  throw ApiError.badRequest('INVALID_PARAMETER', 'Estado de pedido no válido.', { field: 'status' });
}

// ---- Carrito ----------------------------------------------------------------
const cartRouter = express.Router();
cartRouter.use(authorize('user', 'company'));
cartRouter.get('/', h(async (req, res) => res.json(await cart.get(req))));
cartRouter.post(
  '/items',
  h(async (req, res) => {
    const productId = validateId(req.body?.productId, 'productId');
    const quantity = v.validateQuantity(req.body?.quantity ?? 1);
    res.status(201).json(await cart.add(req, productId, quantity));
  }),
);
cartRouter.patch(
  '/items/:productId',
  h(async (req, res) => {
    const productId = validateId(req.params.productId, 'productId');
    const raw = req.body?.quantity;
    const quantity = raw === 0 || raw === '0' ? 0 : v.validateQuantity(raw);
    res.json(await cart.setQuantity(req, productId, quantity));
  }),
);
cartRouter.delete('/items/:productId', h(async (req, res) => res.json(await cart.remove(req, validateId(req.params.productId, 'productId')))));
cartRouter.delete('/', h(async (req, res) => res.json(await cart.clear(req))));

// ---- Pedidos del usuario -------------------------------------------------------
const orderRouter = express.Router();
orderRouter.use(authorize('user', 'company'));
orderRouter.get(
  '/',
  h(async (req, res) =>
    res.json(await orders.list({ userId: req.user.id, status: parseOrderStatus(req.query.status), ...parsePagination(req.query) })),
  ),
);
/** Cifras del perfil: número de pedidos y total gastado (sin cancelados). */
orderRouter.get(
  '/stats',
  h(async (req, res) => {
    const [[r]] = await pool.query(
      "SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total END), 0) AS spent FROM orders WHERE user_id = ?",
      [req.user.id],
    );
    res.json({ data: { orders: Number(r.orders), spent: Number(r.spent) } });
  }),
);
orderRouter.get('/:id', h(async (req, res) => res.json(await orders.getById(validateId(req.params.id), { userId: req.user.id }))));
/** Compra desde el carrito. */
orderRouter.post('/', h(async (req, res) => res.status(201).json(await orders.create(req.user, v.validateCheckout(req.body || {})))));
/** Pedido masivo (rol Empresa): líneas explícitas, sin pasar por el carrito. */
orderRouter.post(
  '/bulk',
  authorize('company'),
  h(async (req, res) => res.status(201).json(await orders.create(req.user, v.validateCheckout(req.body || {}, { allowItems: true })))),
);
orderRouter.post(
  '/:id/cancel',
  h(async (req, res) => res.json(await orders.applyStatus(validateId(req.params.id), 'cancelled', { userId: req.user.id }))),
);

// ---- Direcciones ---------------------------------------------------------------
const addressRouter = express.Router();
addressRouter.get('/', h(async (req, res) => res.json({ data: await addresses.list(req.user.id) })));
addressRouter.post('/', h(async (req, res) => res.status(201).json({ data: await addresses.create(req.user.id, v.validateAddress(req.body || {})) })));
addressRouter.put(
  '/:id',
  h(async (req, res) => res.json({ data: await addresses.update(req.user.id, validateId(req.params.id), v.validateAddress(req.body || {}, { partial: true })) })),
);
addressRouter.delete(
  '/:id',
  h(async (req, res) => {
    await addresses.remove(req.user.id, validateId(req.params.id));
    res.status(204).end();
  }),
);

// ---- Métodos de pago -------------------------------------------------------------
const paymentRouter = express.Router();
paymentRouter.get('/', h(async (req, res) => res.json({ data: await payments.list(req.user.id) })));
paymentRouter.post('/', h(async (req, res) => res.status(201).json({ data: await payments.create(req.user.id, v.validateCard(req.body || {})) })));
paymentRouter.delete(
  '/:id',
  h(async (req, res) => {
    await payments.remove(req.user.id, validateId(req.params.id));
    res.status(204).end();
  }),
);

// ---- Ayuda y soporte ---------------------------------------------------------------
const supportRouter = express.Router();
supportRouter.get(
  '/messages',
  h(async (req, res) => {
    const [rows] = await pool.query('SELECT id, message, status, created_at FROM support_messages WHERE user_id = ? ORDER BY id DESC LIMIT 20', [req.user.id]);
    res.json({ data: rows.map((r) => ({ id: r.id, message: r.message, status: r.status, createdAt: r.created_at })) });
  }),
);
supportRouter.post(
  '/messages',
  h(async (req, res) => {
    const { message } = v.validateSupportMessage(req.body || {});
    const [r] = await pool.query('INSERT INTO support_messages (user_id, message) VALUES (?, ?)', [req.user.id, message]);
    res.status(201).json({ data: { id: r.insertId, message, status: 'open' } });
  }),
);

// ---- Cuenta Empresa ------------------------------------------------------------------
const companyRouter = express.Router();
companyRouter.use(authorize('company'));
companyRouter.get('/', h(async (req, res) => res.json(await company.overview(req.user.companyId))));
companyRouter.get(
  '/invoices',
  h(async (req, res) => {
    const status = req.query.status || 'all';
    if (!['all', 'unpaid', 'pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
      throw ApiError.badRequest('INVALID_PARAMETER', 'Estado de factura no válido.', { field: 'status' });
    }
    res.json(await company.invoices(req.user.companyId, status));
  }),
);
companyRouter.get('/invoices/:id', h(async (req, res) => res.json(await company.invoiceDetail(req.user.companyId, validateId(req.params.id)))));
companyRouter.post('/invoices/:id/pay', h(async (req, res) => res.json(await company.payInvoice(req.user.companyId, validateId(req.params.id)))));
companyRouter.get('/contacts', h(async (req, res) => res.json(await company.contacts(req.user.companyId))));
companyRouter.get('/users', h(async (req, res) => res.json(await company.users(req.user.companyId))));
companyRouter.get(
  '/orders',
  h(async (req, res) =>
    res.json(await orders.list({ companyId: req.user.companyId, status: parseOrderStatus(req.query.status), ...parsePagination(req.query) })),
  ),
);

module.exports = { cartRouter, orderRouter, addressRouter, paymentRouter, supportRouter, companyRouter, parseOrderStatus, parseSearch };
