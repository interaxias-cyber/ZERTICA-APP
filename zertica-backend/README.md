# zertica-backend

API REST de Zertica – Drywall Shop. Node.js ≥ 18 · Express 4.21 · MySQL 8 (mysql2/promise) · bcrypt · JWT · dotenv.

## Instalación

```bash
npm install
cp .env.example .env     # completa DB_* y JWT_SECRET
npm run db:init          # crea la base "zertica", sus 5 tablas y los datos de prueba
npm run dev              # o: npm start
```

| Script | Descripción |
| --- | --- |
| `npm start` / `npm run dev` | Arranca la API (dev con recarga automática). No arranca si MySQL no responde. |
| `npm run db:init` | Ejecuta `database/schema.sql` + `database/seed.sql` y copia las imágenes de prueba a `uploads/products/`. **Borra y recrea las tablas.** `-- --no-seed` para solo esquema. |
| `npm run seed:admin -- <usuario> <correo> <contraseña> ["Nombre"]` | Crea o actualiza un administrador. |
| `npm test` | Pruebas de integración contra MySQL real (**reinicia la base**). |

## Estructura

```
src/
  app.js, server.js          Ensamblado de Express y arranque/cierre ordenado
  config/                    env.js (variables), db.js (pool mysql2, 10 conexiones)
  routes/                    index, auth, profile, product, admin
  controllers/               Orquestan validación → servicio → respuesta
  validators/                Validación de entradas (RN14, RNF05)
  services/                  Lógica de negocio y DTO (contrato JSON)
  models/                    SQL parametrizado
  middlewares/               auth (JWT + rol), upload (multer), errorHandler
  utils/                     ApiError, asyncHandler, url
database/                    schema.sql, seed.sql, seed-images/ (fotos de prueba de Figma)
uploads/products/            Imágenes de producto subidas (no se versionan)
tests/                       Pruebas de integración (node:test)
```

## Base de datos

**MVP (5 tablas):** `users`, `categories`, `brands`, `products`, `product_features`.
**Ampliación v2 (9 tablas):** `companies`, `addresses`, `payment_methods`, `cart_items`, `orders`, `order_items`, `invoices`, `account_contacts`, `support_messages`; además `products.price`, `products.stock`, `users.company_id`, `users.phone` y el rol `company`.

MVP: Claves foráneas `products → categories / brands` (`ON DELETE RESTRICT`, `ON UPDATE CASCADE`) y `product_features → products` (`ON DELETE CASCADE`). Restricciones `UNIQUE` en usuario, correo, referencia, nombre de categoría, nombre de marca y (producto, característica). Índices por categoría/marca + estado, rol + estado y `FULLTEXT (name, description)`.

## Autenticación

`Authorization: Bearer <token>`. Contraseñas: mínimo 8 caracteres, una mayúscula, un número y un carácter especial. El token (JWT HS256, 8 h por defecto) se obtiene en `/api/auth/login` o `/api/auth/register`. En cada petición se comprueba que la cuenta siga existiendo y **activa**: desactivar una cuenta invalida sus sesiones al instante (`403 ACCOUNT_DISABLED`).

## Endpoints

Errores: `{ "error": { "code": "…", "message": "…", "details": [ { "field", "code" } ] } }`.

### Público

| Ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `GET /api/health` | — | `200 {status:"ok",database:"up"}` · `503` si MySQL no responde |
| `POST /api/auth/register` | `{ username, fullName, email, password, language? }` | `201 { token, expiresAt, user }` · `400 VALIDATION_ERROR` · `409 ALREADY_EXISTS` |
| `POST /api/auth/login` | `{ username, password }` (`username` acepta usuario **o** correo) | `200 { token, expiresAt, user }` · `401 INVALID_CREDENTIALS` · `403 ACCOUNT_DISABLED` |
| `POST /api/auth/forgot-password` | `{ email }` | `200 { message }` (siempre igual). En desarrollo sin SMTP añade `devResetToken`. |
| `POST /api/auth/reset-password` | `{ token, password }` | `200 { message }` · `400 INVALID_RESET_TOKEN` (código de un solo uso, 30 min) |

### Usuario autenticado

| Ruta | Descripción |
| --- | --- |
| `POST /api/auth/logout` | `204`. El cliente elimina el token. |
| `GET /api/me` | Perfil (`{ data: user }`), nunca incluye el hash. |
| `PATCH /api/me` | `{ fullName?, email?, language? }` (CU-07, RF09). |
| `PUT /api/me/password` | `{ currentPassword, newPassword }` (CU-08). |
| `GET /api/products` | Contrato documentado. Query: `page` (1), `limit` (20, máx. 100), `search` (≤ 100, referencia o nombre), `category_id`, `brand_id`. Solo productos activos de categorías activas. Respuesta `{ data: [{ id, reference, name, description, imageUrl, category:{id,name}, brand:{id,name} }], meta: { page, limit, total, totalPages } }`. |
| `GET /api/products/:id` | Detalle + `features: [{ id, name, value }]`. `404 PRODUCT_NOT_FOUND` si no existe, está desactivado o su categoría lo está. |
| `GET /api/categories` | Categorías activas con `productCount`. |
| `GET /api/brands` | Marcas. |

### Administrador (`role = admin`; si no, `403 FORBIDDEN`)

| Ruta | Descripción |
| --- | --- |
| `GET /api/admin/summary` | Conteos: `products {total, active, inactive, withoutImage}`, `categories {total, active, inactive}`, `brands {total}`, `users {total, active, inactive, admins}`. |
| `GET /api/admin/products` | Todos los productos. Query de `/products` + `status=all\|active\|inactive`. Incluye `isActive` y `category.isActive`. |
| `GET /api/admin/products/:id` | Detalle administrativo. |
| `POST /api/admin/products` | `multipart/form-data`: `reference`, `name`, `description?`, `category_id`, `brand_id`, `image` (**obligatoria**, JPG/PNG/WEBP ≤ 5 MB). `409 REFERENCE_ALREADY_EXISTS`. |
| `PUT /api/admin/products/:id` | Igual, todos los campos opcionales; `image` reemplaza la anterior (se borra el archivo viejo). |
| `PATCH /api/admin/products/:id/status` | `{ isActive }`. Al reactivar con la categoría desactivada devuelve `warning: CATEGORY_INACTIVE`. |
| `GET /api/admin/categories` · `GET /:id` | Todas las categorías con estado y número de productos. |
| `POST /api/admin/categories` · `PUT /:id` | `{ name }` único (`409 CATEGORY_ALREADY_EXISTS`). |
| `PATCH /api/admin/categories/:id/status` | `{ isActive }`. Los productos se conservan. |
| `GET /api/admin/users` | Query: `page`, `limit`, `search`, `role`, `status`. |
| `GET /api/admin/users/:id` | Detalle sin hash. |
| `PATCH /api/admin/users/:id/status` | `{ isActive }`. `400 CANNOT_DEACTIVATE_SELF`. |

## Endpoints de la ampliación v2

| Ruta | Rol | Descripción |
| --- | --- | --- |
| `GET /api/cart` · `POST /api/cart/items {productId, quantity}` · `PATCH /api/cart/items/:productId {quantity}` · `DELETE /api/cart/items/:productId` · `DELETE /api/cart` | user, company | Carrito con totales (descuento por volumen solo para empresa). `409 INSUFFICIENT_STOCK` |
| `POST /api/orders {addressId, paymentType: card\|transfer\|credit, paymentMethodId?, notes?}` | user, company | Compra desde el carrito (transacción: bloquea productos, valida stock, descuenta stock, factura de empresa) |
| `POST /api/orders/bulk {…, items: [{productId, quantity}]}` | company | Pedido masivo |
| `GET /api/orders?status=all\|active\|pending…` · `GET /api/orders/:id` · `GET /api/orders/stats` · `POST /api/orders/:id/cancel` | user, company | Mis pedidos; cancelar repone stock y anula la factura pendiente |
| `GET/POST/PUT/DELETE /api/addresses` | sesión | Direcciones (máx. 10, una principal) |
| `GET/POST/DELETE /api/payment-methods` | sesión | Tarjetas `{number, expiry: "MM/AA", cvv, holderName}`; se guarda marca + últimos 4 |
| `GET/POST /api/support/messages` | sesión | Ayuda y soporte |
| `GET /api/company` · `GET /api/company/invoices?status=` · `GET /api/company/invoices/:id` · `POST /api/company/invoices/:id/pay` · `GET /api/company/contacts` · `GET /api/company/users` · `GET /api/company/orders` | company | Portal Empresa (pago simulado) |
| `GET /api/admin/orders?status=&search=` · `GET /api/admin/orders/:id` · `PATCH /api/admin/orders/:id/status {status}` | admin | Transiciones: pendiente→en proceso/cancelado, en proceso→enviado/cancelado, enviado→completado |
| `GET /api/admin/reports?month=AAAA-MM` · `GET /api/admin/reports/export.csv?month=` | admin | Reporte mensual y CSV (`;`, UTF-8 con BOM, abre en Excel) |

Nuevos códigos de error: `INSUFFICIENT_STOCK`, `PRODUCT_UNAVAILABLE`, `CART_EMPTY`, `CREDIT_LIMIT_EXCEEDED`, `ORDER_NOT_FOUND`, `INVALID_STATUS_TRANSITION`, `ADDRESS_NOT_FOUND`, `PAYMENT_METHOD_NOT_FOUND`, `PAYMENT_METHOD_EXISTS`, `INVOICE_NOT_PAYABLE`, `INVALID_CARD`, `CARD_EXPIRED`.

## Variables de entorno

Ver [`.env.example`](.env.example). Obligatorias: `DB_HOST`, `DB_USER`, `DB_NAME`, `JWT_SECRET`.
