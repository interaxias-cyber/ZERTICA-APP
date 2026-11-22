'use strict';

/**
 * Pruebas de integración contra una base MySQL REAL.
 * ATENCIÓN: reinicia la base (schema.sql + seed.sql). Úsese solo en desarrollo.
 *   npm run db:init && npm test
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'db-init.js')], { stdio: 'ignore' });

const app = require('../src/app');
const { pool } = require('../src/config/db');

let server;
let base;
const tokens = {};

async function api(method, url, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${base}${url}`, { method, headers, body: payload });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

// PNG 1x1 válido
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

function productForm(fields, withImage = true) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
  if (withImage) form.append('image', new Blob([PNG], { type: 'image/png' }), 'test.png');
  return form;
}

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('GET /api/health', async () => {
  const r = await api('GET', '/health');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { status: 'ok', database: 'up' });
});

test('CU-03 inicio de sesión: correcto, incorrecto y cuenta desactivada', async () => {
  let r = await api('POST', '/auth/login', { body: { username: 'admin', password: 'Admin2026#' } });
  assert.equal(r.status, 200);
  assert.ok(r.body.token);
  assert.equal(r.body.user.role, 'admin');
  assert.equal(r.body.user.password_hash, undefined);
  tokens.admin = r.body.token;

  r = await api('POST', '/auth/login', { body: { username: 'juan', password: 'Usuario2026#' } });
  assert.equal(r.status, 200);
  tokens.user = r.body.token;

  r = await api('POST', '/auth/login', { body: { username: 'juan', password: 'mala' } });
  assert.equal(r.status, 401);
  assert.equal(r.body.error.code, 'INVALID_CREDENTIALS');

  r = await api('POST', '/auth/login', { body: { username: 'pedro', password: 'Inactivo2026#' } });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'ACCOUNT_DISABLED');

  r = await api('POST', '/auth/login', { body: { username: 'admin@zertica.com', password: 'Admin2026#' } });
  assert.equal(r.status, 200, 'inicio de sesión con correo (diseño de Figma)');
  assert.equal(r.body.user.username, 'admin');

  r = await api('POST', '/auth/login', { body: {} });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'VALIDATION_ERROR');
});

test('CU-01/CU-02 registro con validación y unicidad', async () => {
  let r = await api('POST', '/auth/register', {
    body: { username: 'nuevo', fullName: 'Nuevo Usuario', email: 'nuevo@zertica.local', password: 'Nuevo123*', language: 'en' },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.role, 'user');
  assert.equal(r.body.user.language, 'en');
  tokens.nuevo = r.body.token;

  r = await api('POST', '/auth/register', {
    body: { username: 'nuevo', fullName: 'Otro', email: 'nuevo@zertica.local', password: 'Nuevo123*' },
  });
  assert.equal(r.status, 409);
  assert.deepEqual(r.body.error.details.map((d) => d.field).sort(), ['email', 'username']);

  r = await api('POST', '/auth/register', {
    body: { username: 'otro', fullName: 'Otro Usuario', email: 'otro@zertica.local', password: 'sinmayuscula1*' },
  });
  assert.equal(r.status, 400, 'la contraseña exige mayúscula, número y carácter especial');
  assert.equal(r.body.error.details[0].code, 'WEAK_PASSWORD');

  r = await api('POST', '/auth/register', { body: { username: 'a', email: 'x', password: '123' } });
  assert.equal(r.status, 400);
  const fields = r.body.error.details.map((d) => d.field).sort();
  assert.deepEqual(fields, ['email', 'fullName', 'password', 'username']);
});

test('RN01 el catálogo exige sesión', async () => {
  const r = await api('GET', '/products');
  assert.equal(r.status, 401);
  assert.equal(r.body.error.code, 'UNAUTHORIZED');
});

test('CU-09..CU-13 catálogo: contrato, búsqueda, filtros, paginación', async () => {
  let r = await api('GET', '/products', { token: tokens.user });
  assert.equal(r.status, 200);
  assert.equal(r.body.meta.total, 6);
  assert.deepEqual(r.body.meta, { page: 1, limit: 20, total: 6, totalPages: 1 });
  const p = r.body.data[0];
  assert.deepEqual(Object.keys(p).sort(), ['brand', 'category', 'description', 'id', 'imageUrl', 'name', 'reference']);

  // Ejemplo de la presentación: search=PLC&category_id=1 → total 2
  r = await api('GET', '/products?search=PLC&category_id=1&page=1&limit=20', { token: tokens.user });
  assert.equal(r.body.meta.total, 2);
  const std = r.body.data.find((x) => x.reference === 'PLC-STD-12');
  assert.equal(std.name, 'Placa de yeso estándar 1/2"');
  assert.equal(std.category.name, 'Placas y paneles');
  assert.equal(std.brand.name, 'Marca Alfa');

  r = await api('GET', '/products?search=perfil', { token: tokens.user });
  assert.equal(r.body.meta.total, 2);

  r = await api('GET', '/products?brand_id=2', { token: tokens.user });
  assert.equal(r.body.meta.total, 2);

  r = await api('GET', '/products?search=%25', { token: tokens.user });
  assert.equal(r.body.meta.total, 0, 'el comodín % se trata como texto');

  r = await api('GET', '/products?limit=2&page=2', { token: tokens.user });
  assert.equal(r.body.data.length, 2);
  assert.equal(r.body.meta.totalPages, 3);

  r = await api('GET', '/products?limit=101', { token: tokens.user });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'INVALID_PARAMETER');

  r = await api('GET', '/products?category_id=abc', { token: tokens.user });
  assert.equal(r.status, 400);

  r = await api('GET', `/products?search=${'x'.repeat(101)}`, { token: tokens.user });
  assert.equal(r.status, 400);

  r = await api('GET', '/categories', { token: tokens.user });
  assert.equal(r.body.data.length, 4);
  r = await api('GET', '/brands', { token: tokens.user });
  assert.equal(r.body.data.length, 3);
});

test('CU-14/CU-15 detalle con características', async () => {
  let r = await api('GET', '/products/1', { token: tokens.user });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.reference, 'PLC-STD-12');
  assert.deepEqual(r.body.data.features.map((f) => [f.name, f.value]), [['Espesor', '12.7 mm'], ['Dimensiones', '1.22 x 2.44 m']]);
  const img = await fetch(r.body.data.imageUrl);
  assert.equal(img.status, 200, 'la imagen de prueba se sirve desde /uploads');

  r = await api('GET', '/products/999', { token: tokens.user });
  assert.equal(r.status, 404);
  assert.equal(r.body.error.code, 'PRODUCT_NOT_FOUND');
});

test('CU-06/CU-07/CU-08 perfil, idioma y contraseña', async () => {
  let r = await api('GET', '/me', { token: tokens.nuevo });
  assert.equal(r.body.data.username, 'nuevo');

  r = await api('PATCH', '/me', { token: tokens.nuevo, body: { fullName: 'Nuevo Editado', language: 'es' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.fullName, 'Nuevo Editado');
  assert.equal(r.body.data.language, 'es');

  r = await api('PATCH', '/me', { token: tokens.nuevo, body: { email: 'admin@zertica.com' } });
  assert.equal(r.status, 409);

  r = await api('PUT', '/me/password', { token: tokens.nuevo, body: { currentPassword: 'mala1234', newPassword: 'Otra1234*' } });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.details[0].code, 'INCORRECT_PASSWORD');

  r = await api('PUT', '/me/password', { token: tokens.nuevo, body: { currentPassword: 'Nuevo123*', newPassword: 'Otra1234*' } });
  assert.equal(r.status, 200);
  r = await api('POST', '/auth/login', { body: { username: 'nuevo', password: 'Otra1234*' } });
  assert.equal(r.status, 200);
});

test('CU-04 recuperación de contraseña (modo desarrollo)', async () => {
  let r = await api('POST', '/auth/forgot-password', { body: { email: 'noexiste@zertica.local' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.devResetToken, undefined);

  r = await api('POST', '/auth/forgot-password', { body: { email: 'nuevo@zertica.local' } });
  assert.equal(r.status, 200);
  const token = r.body.devResetToken;
  assert.ok(token);

  r = await api('POST', '/auth/reset-password', { body: { token, password: 'Reset123*' } });
  assert.equal(r.status, 200);
  r = await api('POST', '/auth/reset-password', { body: { token, password: 'Reset999*' } });
  assert.equal(r.status, 400, 'el código es de un solo uso');
  r = await api('POST', '/auth/login', { body: { username: 'nuevo', password: 'Reset123*' } });
  assert.equal(r.status, 200);
});

test('RN06 un usuario normal no accede a administración', async () => {
  for (const url of ['/admin/products', '/admin/categories', '/admin/users']) {
    const r = await api('GET', url, { token: tokens.user });
    assert.equal(r.status, 403);
  }
});

test('CU-16..CU-21 gestión de productos e imágenes', async () => {
  let r = await api('POST', '/admin/products', {
    token: tokens.admin,
    form: productForm({ reference: 'TRN-PAN-2', name: 'Tornillo punta aguja 2"', description: 'Prueba', category_id: 3, brand_id: 1 }, false),
  });
  assert.equal(r.status, 400, 'imagen obligatoria al crear');
  assert.equal(r.body.error.details[0].field, 'image');

  r = await api('POST', '/admin/products', {
    token: tokens.admin,
    form: productForm({ reference: 'PLC-STD-12', name: 'Duplicada', category_id: 1, brand_id: 1 }),
  });
  assert.equal(r.status, 409);

  r = await api('POST', '/admin/products', {
    token: tokens.admin,
    form: productForm({ reference: 'trn-pan-2', name: 'Tornillo punta aguja 2"', description: 'Prueba', category_id: 3, brand_id: 1 }),
  });
  assert.equal(r.status, 201);
  const created = r.body.data;
  assert.equal(created.reference, 'TRN-PAN-2');
  assert.match(created.imageUrl, /\/uploads\/products\/.+\.png$/);
  const img = await fetch(created.imageUrl);
  assert.equal(img.status, 200);

  r = await api('PUT', `/admin/products/${created.id}`, { token: tokens.admin, form: productForm({ name: 'Tornillo 2" editado' }, false) });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.name, 'Tornillo 2" editado');
  assert.equal(r.body.data.imageUrl, created.imageUrl);

  r = await api('PUT', `/admin/products/${created.id}`, { token: tokens.admin, form: productForm({}) });
  assert.notEqual(r.body.data.imageUrl, created.imageUrl, 'imagen reemplazada');
  const oldFile = path.join(__dirname, '..', 'uploads', 'products', path.basename(created.imageUrl));
  await new Promise((res) => setTimeout(res, 100));
  assert.equal(fs.existsSync(oldFile), false, 'la imagen anterior se elimina');

  r = await api('PATCH', `/admin/products/${created.id}/status`, { token: tokens.admin, body: { isActive: false } });
  assert.equal(r.body.data.isActive, false);
  r = await api('GET', `/products/${created.id}`, { token: tokens.user });
  assert.equal(r.status, 404, 'desactivado no aparece en catálogo');
  r = await api('PATCH', `/admin/products/${created.id}/status`, { token: tokens.admin, body: { isActive: false } });
  assert.equal(r.status, 409);

  r = await api('GET', '/admin/products?status=inactive', { token: tokens.admin });
  assert.equal(r.body.meta.total, 1);
  r = await api('GET', '/admin/products', { token: tokens.admin });
  assert.equal(r.body.meta.total, 7);

  r = await api('PATCH', `/admin/products/${created.id}/status`, { token: tokens.admin, body: { isActive: true } });
  assert.equal(r.body.data.isActive, true);
});

test('CU-22..CU-24 gestión de categorías', async () => {
  let r = await api('POST', '/admin/categories', { token: tokens.admin, body: { name: 'Accesorios' } });
  assert.equal(r.status, 201);
  const id = r.body.data.id;
  r = await api('POST', '/admin/categories', { token: tokens.admin, body: { name: 'Accesorios' } });
  assert.equal(r.status, 409);
  r = await api('PUT', `/admin/categories/${id}`, { token: tokens.admin, body: { name: 'Accesorios y herramientas' } });
  assert.equal(r.body.data.name, 'Accesorios y herramientas');

  // Desactivar "Masillas" (id 4): su producto desaparece del catálogo pero se conserva.
  r = await api('PATCH', '/admin/categories/4/status', { token: tokens.admin, body: { isActive: false } });
  assert.equal(r.body.data.isActive, false);
  r = await api('GET', '/products?category_id=4', { token: tokens.user });
  assert.equal(r.body.meta.total, 0);
  r = await api('GET', '/admin/products?category_id=4', { token: tokens.admin });
  assert.equal(r.body.meta.total, 1);
  r = await api('GET', '/categories', { token: tokens.user });
  assert.ok(!r.body.data.some((c) => c.id === 4));
  r = await api('PATCH', '/admin/categories/4/status', { token: tokens.admin, body: { isActive: true } });
  assert.equal(r.body.data.isActive, true);
});

test('CU-25..CU-27 gestión de usuarios', async () => {
  let r = await api('GET', '/admin/users', { token: tokens.admin });
  assert.equal(r.status, 200);
  assert.ok(r.body.meta.total >= 5);
  assert.ok(r.body.data.every((u) => u.password_hash === undefined && u.passwordHash === undefined));

  const usuario = r.body.data.find((u) => u.username === 'juan');
  r = await api('GET', `/admin/users/${usuario.id}`, { token: tokens.admin });
  assert.equal(r.body.data.email, 'juan@mail.com');

  r = await api('PATCH', `/admin/users/${usuario.id}/status`, { token: tokens.admin, body: { isActive: false } });
  assert.equal(r.body.data.isActive, false);
  r = await api('GET', '/products', { token: tokens.user });
  assert.equal(r.status, 403, 'el token de una cuenta desactivada deja de valer');
  r = await api('PATCH', `/admin/users/${usuario.id}/status`, { token: tokens.admin, body: { isActive: true } });
  assert.equal(r.body.data.isActive, true);

  const me = (await api('GET', '/me', { token: tokens.admin })).body.data;
  r = await api('PATCH', `/admin/users/${me.id}/status`, { token: tokens.admin, body: { isActive: false } });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'CANNOT_DEACTIVATE_SELF');
});

test('resumen del panel administrativo', async () => {
  let r = await api('GET', '/admin/summary', { token: tokens.admin });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.categories.total, 5);
  assert.equal(r.body.data.brands.total, 3);
  assert.ok(r.body.data.products.total >= 7);
  assert.ok(r.body.data.users.admins >= 1);
  r = await api('GET', '/admin/summary', { token: tokens.user });
  assert.equal(r.status, 403);
});

test('errores uniformes', async () => {
  const r = await api('GET', '/no-existe');
  assert.equal(r.status, 404);
  assert.equal(r.body.error.code, 'ROUTE_NOT_FOUND');
});
