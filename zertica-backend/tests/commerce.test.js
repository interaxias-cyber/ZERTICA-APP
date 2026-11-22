'use strict';

/**
 * Pruebas de la ampliación v2 (carrito, pedidos, direcciones, pagos, ayuda,
 * rol Empresa, pedidos y reportes del panel) contra MySQL REAL.
 * ATENCIÓN: reinicia la base de datos.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { execFileSync } = require('child_process');

execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'db-init.js')], { stdio: 'ignore' });

const app = require('../src/app');
const { pool } = require('../src/config/db');

let server;
let base;
const t = {};

async function api(method, url, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${base}${url}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed, headers: res.headers };
}

const login = async (username, password) => (await api('POST', '/auth/login', { body: { username, password } })).body.token;
const stockOf = async (id) => (await pool.query('SELECT stock FROM products WHERE id = ?', [id]))[0][0].stock;

before(async () => {
  await new Promise((r) => {
    server = app.listen(0, '127.0.0.1', r);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
  t.juan = await login('juan', 'Usuario2026#');
  t.maria = await login('maria', 'Usuario2026#');
  t.admin = await login('admin', 'Admin2026#');
  t.company = await login('constructora', 'Empresa2026#');
});

after(async () => {
  await new Promise((r) => server.close(r));
  await pool.end();
});

test('productos incluyen precio y existencias', async () => {
  const r = await api('GET', '/products/1', { token: t.juan });
  assert.equal(r.body.data.price, 185);
  assert.equal(r.body.data.stock, 240);
});

test('control de acceso por rol en los módulos nuevos', async () => {
  assert.equal((await api('GET', '/company', { token: t.juan })).status, 403);
  assert.equal((await api('GET', '/admin/orders', { token: t.company })).status, 403);
  assert.equal((await api('GET', '/cart', { token: t.admin })).status, 403);
  assert.equal((await api('GET', '/cart')).status, 401);
});

test('direcciones: CRUD, predeterminada y propiedad', async () => {
  let r = await api('GET', '/addresses', { token: t.juan });
  assert.equal(r.body.data.length, 2);
  assert.equal(r.body.data[0].isDefault, true);
  r = await api('POST', '/addresses', { token: t.juan, body: { label: 'Obra', line1: 'Calle 1 # 2-3', city: 'Bogotá', isDefault: true } });
  assert.equal(r.status, 201);
  const id = r.body.data.id;
  r = await api('GET', '/addresses', { token: t.juan });
  assert.equal(r.body.data.filter((a) => a.isDefault).length, 1);
  assert.equal(r.body.data[0].id, id);
  r = await api('POST', '/addresses', { token: t.juan, body: { label: '', line1: '' } });
  assert.equal(r.status, 400);
  r = await api('PUT', `/addresses/${id}`, { token: t.maria, body: { label: 'x' } });
  assert.equal(r.status, 404, 'no puede editar direcciones ajenas');
  r = await api('DELETE', `/addresses/${id}`, { token: t.juan });
  assert.equal(r.status, 204);
  r = await api('GET', '/addresses', { token: t.juan });
  assert.equal(r.body.data.filter((a) => a.isDefault).length, 1, 'se reasigna la predeterminada');
});

test('métodos de pago: Luhn, vencimiento y solo últimos 4 dígitos', async () => {
  let r = await api('POST', '/payment-methods', { token: t.maria, body: { number: '4242 4242 4242 4241', expiry: '12/30', cvv: '123', holderName: 'María' } });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.details[0].code, 'INVALID_CARD');
  r = await api('POST', '/payment-methods', { token: t.maria, body: { number: '5555555555554444', expiry: '01/20', cvv: '123', holderName: 'María' } });
  assert.equal(r.body.error.details[0].code, 'CARD_EXPIRED');
  r = await api('POST', '/payment-methods', { token: t.maria, body: { number: '5555 5555 5555 4444', expiry: '10/31', cvv: '123', holderName: 'María López' } });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.brand, 'mastercard');
  assert.equal(r.body.data.last4, '4444');
  const [rows] = await pool.query("SELECT * FROM payment_methods WHERE last4 = '4444'");
  assert.ok(!JSON.stringify(rows).includes('5555555555554444'), 'nunca se guarda el número completo');
  r = await api('DELETE', `/payment-methods/${r.body.data.id}`, { token: t.maria });
  assert.equal(r.status, 204);
});

test('carrito y compra con tarjeta: stock, totales y carrito vaciado', async () => {
  let r = await api('POST', '/cart/items', { token: t.juan, body: { productId: 1, quantity: 3 } });
  assert.equal(r.status, 201);
  r = await api('POST', '/cart/items', { token: t.juan, body: { productId: 1, quantity: 2 } });
  assert.equal(r.body.data.items[0].quantity, 5);
  r = await api('POST', '/cart/items', { token: t.juan, body: { productId: 6, quantity: 1 } });
  assert.equal(r.body.data.subtotal, 5 * 185 + 320);
  assert.equal(r.body.data.discountPercent, 0, 'los usuarios normales no tienen descuento por volumen');
  r = await api('POST', '/cart/items', { token: t.juan, body: { productId: 6, quantity: 999 } });
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, 'INSUFFICIENT_STOCK');
  r = await api('PATCH', '/cart/items/6', { token: t.juan, body: { quantity: 2 } });
  assert.equal(r.body.data.itemCount, 7);

  const cards = (await api('GET', '/payment-methods', { token: t.juan })).body.data;
  const addr = (await api('GET', '/addresses', { token: t.juan })).body.data[0];
  r = await api('POST', '/orders', { token: t.juan, body: { addressId: addr.id, paymentType: 'credit' } });
  assert.equal(r.status, 400, 'el crédito es solo para empresas');

  const before = await stockOf(1);
  r = await api('POST', '/orders', { token: t.juan, body: { addressId: addr.id, paymentType: 'card', paymentMethodId: cards[0].id } });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.status, 'processing');
  assert.equal(r.body.data.total, 5 * 185 + 2 * 320);
  assert.match(r.body.data.code, /^Z-\d{4}$/);
  assert.equal(r.body.data.items.length, 2);
  assert.equal(await stockOf(1), before - 5);
  t.orderId = r.body.data.id;
  r = await api('GET', '/cart', { token: t.juan });
  assert.equal(r.body.data.items.length, 0);
  r = await api('POST', '/orders', { token: t.juan, body: { addressId: addr.id, paymentType: 'transfer' } });
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, 'CART_EMPTY');
});

test('cifras del perfil', async () => {
  const r = await api('GET', '/orders/stats', { token: t.maria });
  assert.equal(r.body.data.orders, 2);
  assert.equal(r.body.data.spent, 1088 + 840);
});

test('mis pedidos: listado, detalle ajeno y cancelación con reposición de stock', async () => {
  let r = await api('GET', '/orders?status=active', { token: t.juan });
  assert.ok(r.body.data.some((o) => o.id === t.orderId));
  r = await api('GET', `/orders/${t.orderId}`, { token: t.maria });
  assert.equal(r.status, 404);
  const before = await stockOf(1);
  r = await api('POST', `/orders/${t.orderId}/cancel`, { token: t.juan });
  assert.equal(r.body.data.status, 'cancelled');
  assert.equal(await stockOf(1), before + 5);
  r = await api('POST', `/orders/${t.orderId}/cancel`, { token: t.juan });
  assert.equal(r.status, 409);
});

test('empresa: pedido masivo con descuento, factura y crédito', async () => {
  let r = await api('GET', '/company', { token: t.company });
  assert.equal(r.status, 200);
  const usedBefore = r.body.data.company.creditUsed;
  const addr = (await api('GET', '/addresses', { token: t.company })).body.data[0];
  r = await api('POST', '/orders/bulk', {
    token: t.company,
    body: { addressId: addr.id, paymentType: 'credit', items: [{ productId: 3, quantity: 60 }, { productId: 4, quantity: 40 }, { productId: 5, quantity: 0 }] },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.discountPercent, 10, '100 unidades → 10 %');
  const total = r.body.data.total;
  assert.equal(total, (60 * 95 + 40 * 105) * 0.9);
  assert.equal(r.body.data.invoice.status, 'pending');
  r = await api('GET', '/company', { token: t.company });
  assert.equal(r.body.data.company.creditUsed, usedBefore + total);

  r = await api('POST', '/orders/bulk', {
    token: t.company,
    body: { addressId: addr.id, paymentType: 'credit', items: [{ productId: 5, quantity: 1201 }] },
  });
  assert.equal(r.status, 409);
  assert.equal(r.body.error.code, 'INSUFFICIENT_STOCK');

  await pool.query('UPDATE companies SET credit_limit = credit_used + 10 WHERE id = 1');
  r = await api('POST', '/orders/bulk', { token: t.company, body: { addressId: addr.id, paymentType: 'credit', items: [{ productId: 1, quantity: 1 }] } });
  assert.equal(r.body.error.code, 'CREDIT_LIMIT_EXCEEDED');
  await pool.query('UPDATE companies SET credit_limit = 500000 WHERE id = 1');

  assert.equal((await api('POST', '/orders/bulk', { token: t.juan, body: {} })).status, 403);
});

test('empresa: facturas, pago simulado, contactos y usuarios', async () => {
  let r = await api('GET', '/company/invoices?status=unpaid', { token: t.company });
  assert.ok(r.body.meta.unpaidCount >= 3);
  const overdue = r.body.data.find((i) => i.status === 'overdue');
  assert.ok(overdue, 'existe una factura vencida');
  const used = (await api('GET', '/company', { token: t.company })).body.data.company.creditUsed;
  r = await api('POST', `/company/invoices/${overdue.id}/pay`, { token: t.company });
  assert.equal(r.body.data.find((i) => i.id === overdue.id).status, 'paid');
  const after = (await api('GET', '/company', { token: t.company })).body.data.company.creditUsed;
  assert.equal(Math.round((used - after) * 100) / 100, overdue.amount);
  r = await api('POST', `/company/invoices/${overdue.id}/pay`, { token: t.company });
  assert.equal(r.status, 409);
  r = await api('GET', `/company/invoices/${overdue.id}`, { token: t.company });
  assert.ok(r.body.data.order.items.length > 0);
  r = await api('GET', '/company/contacts', { token: t.company });
  assert.equal(r.body.data.length, 3);
  r = await api('GET', '/company/users', { token: t.company });
  assert.equal(r.body.data[0].username, 'constructora');
});

test('ayuda: mensaje de soporte', async () => {
  let r = await api('POST', '/support/messages', { token: t.juan, body: { message: 'corto' } });
  assert.equal(r.status, 400);
  r = await api('POST', '/support/messages', { token: t.juan, body: { message: '¿Cuánto tarda la entrega a Bogotá?' } });
  assert.equal(r.status, 201);
});

test('panel: pedidos, transiciones de estado, resumen y reportes', async () => {
  let r = await api('GET', '/admin/orders?status=pending', { token: t.admin });
  assert.ok(r.body.data.length >= 1);
  const pending = r.body.data[0];
  r = await api('PATCH', `/admin/orders/${pending.id}/status`, { token: t.admin, body: { status: 'completed' } });
  assert.equal(r.status, 409, 'no se puede saltar de pendiente a completado');
  r = await api('PATCH', `/admin/orders/${pending.id}/status`, { token: t.admin, body: { status: 'processing' } });
  assert.equal(r.body.data.status, 'processing');
  r = await api('GET', '/admin/orders?search=Constructora', { token: t.admin });
  assert.ok(r.body.data.every((o) => o.company?.name === 'Constructora XYZ'));

  r = await api('GET', '/admin/summary', { token: t.admin });
  assert.equal(r.body.data.weekSales.length, 7);
  assert.ok(r.body.data.orders.active >= 1);
  assert.equal(r.body.data.latestOrders.length, 3);

  r = await api('GET', '/admin/reports', { token: t.admin });
  assert.ok(r.body.data.totalSales > 0);
  assert.ok(r.body.data.salesByCategory.length > 0);
  r = await api('GET', '/admin/reports?month=2026-13', { token: t.admin });
  assert.equal(r.status, 400);
  r = await api('GET', '/admin/reports/export.csv', { token: t.admin });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/csv/);
  assert.match(r.body, /Ventas totales;/);

  r = await api('GET', '/admin/users?role=company', { token: t.admin });
  assert.equal(r.body.meta.total, 2);
  assert.ok(r.body.data[0].ordersCount >= 1);
});
