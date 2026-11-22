# ZERTICA – Drywall Shop

Aplicación móvil Android de Zertica (materiales de construcción en seco): catálogo, compras con carrito y pedidos, portal para empresas con crédito y facturación, y panel de administración con pedidos y reportes de ventas. Backend propio (Node.js + Express) y base de datos MySQL 8.

> **Versiones.** El **MVP** (27 casos de uso, 5 tablas) es la base del proyecto. La **ampliación v2** añade las pantallas del Figma que estaban fuera del MVP —Carrito, Mis pedidos, Direcciones, Métodos de pago, Ayuda, Términos, Pedidos y Reportes del panel, y las 6 pantallas del rol Empresa— con 9 tablas nuevas. Ver la sección 5.

```
App Zertica (Expo · React Native · Android)  ──HTTP/JSON──▶  API REST (Express)  ──mysql2──▶  MySQL 8 (base "zertica")
```

| Carpeta | Contenido |
| --- | --- |
| [`zertica-app/`](zertica-app) | App móvil con **Expo SDK 58** (React Native, TypeScript, Expo Router). Objetivo: Android. |
| [`zertica-backend/`](zertica-backend) | API REST con Node.js ≥ 18, Express 4.21, mysql2/promise, bcrypt, JWT y dotenv. |
| [`zertica-backend/database/`](zertica-backend/database) | `schema.sql` (5 tablas) y `seed.sql` (datos de prueba). |

> **Tecnología de la app.** La especificación original nombra Flutter; por decisión del equipo la app se construyó con **Expo (React Native)**. La arquitectura (app → API REST → Node/Express → MySQL), los casos de uso y las reglas de negocio no cambian.

---

## 1. Requisitos

- Node.js 18 o superior (probado con Node 22) y npm.
- MySQL 8.
- Para probar en Android: la app **Expo Go** en el teléfono, o Android Studio con un emulador.
- Para generar el APK: una cuenta gratuita de Expo (EAS Build) **o** Android Studio / Android SDK + JDK 17.

## 2. Puesta en marcha rápida

### 2.1 Base de datos y backend

```bash
cd zertica-backend
npm install
cp .env.example .env      # edita DB_USER, DB_PASSWORD y JWT_SECRET
```

Crea un usuario MySQL para la app (ejemplo):

```sql
CREATE USER 'zertica'@'localhost' IDENTIFIED BY 'tu_contraseña';
GRANT ALL PRIVILEGES ON zertica.* TO 'zertica'@'localhost';
GRANT CREATE ON *.* TO 'zertica'@'localhost';   -- solo para que db:init pueda crear la base
```

Crea la base, las tablas y los datos de prueba, y arranca la API:

```bash
npm run db:init           # ejecuta database/schema.sql + database/seed.sql (borra y recrea las tablas)
npm run dev               # http://0.0.0.0:3000/api
```

Comprueba: `curl http://localhost:3000/api/health` → `{"status":"ok","database":"up"}`.

También puedes cargar el SQL a mano: `mysql -u root -p < database/schema.sql && mysql -u root -p < database/seed.sql`.

### 2.2 App móvil

```bash
cd zertica-app
npm install
cp .env.example .env      # opcional: fija EXPO_PUBLIC_API_URL
npx expo start
```

Escanea el código QR con **Expo Go** (Android) o pulsa `a` para abrir el emulador.

## 3. Conexión app ↔ backend

La URL se resuelve en `zertica-app/src/config/env.ts`, en este orden:

1. `EXPO_PUBLIC_API_URL` del archivo `.env` de la app (si existe, siempre gana).
2. En desarrollo, la **IP del equipo que ejecuta `npx expo start`** + puerto `EXPO_PUBLIC_API_PORT` (3000). Sirve sin configurar nada para el teléfono físico en la misma Wi-Fi.
3. Emulador Android: `http://10.0.2.2:3000/api` (10.0.2.2 es el `localhost` del PC visto desde el emulador).
4. Web / local: `http://localhost:3000/api`.

| Escenario | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Emulador Android | `http://10.0.2.2:3000/api` |
| Teléfono Android físico (misma red Wi-Fi) | `http://<IP-del-PC>:3000/api` — p. ej. `http://192.168.1.50:3000/api` (`ipconfig` / `ip addr` para verla) |
| Entorno local (navegador) | `http://localhost:3000/api` |

Notas:
- El backend escucha en `0.0.0.0` (`HOST` en `.env`) para aceptar conexiones de la red local. Abre el puerto 3000 en el firewall del PC si el teléfono no conecta.
- La app permite HTTP sin TLS en Android (`usesCleartextTraffic`, vía `expo-build-properties`) para poder usar el backend local. En producción usa HTTPS.
- Las imágenes de producto se sirven desde `/uploads`. Si el teléfono no las carga, define `PUBLIC_BASE_URL=http://<IP-del-PC>:3000` en el `.env` del backend.

## 4. Usuarios de prueba

Creados por `database/seed.sql` (**solo desarrollo**; en la base se guarda únicamente el hash bcrypt). Son los del diseño de Figma (caja "Demo" del acceso administrativo y lista de usuarios). Se puede entrar con el **usuario o el correo**.

| Usuario | Correo | Contraseña | Rol | Estado | Para qué sirve |
| --- | --- | --- | --- | --- | --- |
| `admin` | `admin@zertica.com` | `Admin2026#` | admin | activo | Botón **Admin** → panel de administración |
| `juan` | `juan@mail.com` | `Usuario2026#` | user | activo | Catálogo, búsqueda, filtros, perfil |
| `maria` | `maria@mail.com` | `Usuario2026#` | user | activo | Segundo usuario de prueba |
| `pedro` | `pedro@mail.com` | `Inactivo2026#` | user | **desactivado** | Comprobar que una cuenta desactivada no entra (RN05) |
| `constructora` | `xyz@empresa.com` | `Empresa2026#` | company | activo | Botón **Empresa** → portal de Constructora XYZ (crédito $500k, premium) |
| `buildpro` | `build@pro.com` | `Empresa2026#` | company | activo | Segunda empresa (BuildPro MX) |

Otro administrador: `npm run seed:admin -- <usuario> <correo> <contraseña> "Nombre completo"`.

**Datos de catálogo de prueba:** 4 categorías, 3 marcas, 6 productos y 5 características, como indica la especificación. Los ejemplos explícitos de la documentación se respetan literalmente (`PLC-STD-12` · *Placa de yeso estándar 1/2"* · *Placas y paneles* · *Marca Alfa*; característica *Espesor 12.7 mm*; `search=PLC&category_id=1` devuelve 2 resultados). El resto de registros se reconstruyó a partir de la descripción del dominio porque el `schema.sql` original no estaba disponible. Las **fotos, precios y existencias** se tomaron del diseño de Figma (`database/seed-images/`); `npm run db:init` copia las fotos a `uploads/products/`.

**Datos de la ampliación v2:** 2 empresas, 13 pedidos con sus líneas (las fechas son relativas al momento de cargar la base, para que el Dashboard y los Reportes siempre tengan datos), 6 facturas (pagadas, pendientes y una vencida), direcciones, tarjetas (solo últimos 4 dígitos) y el equipo de cuenta de cada empresa.

## 5. Funcionalidades

### 5.1 MVP (27 casos de uso)

| Módulo | Casos de uso | Estado |
| --- | --- | --- |
| A · Acceso: idioma, registro con validación, inicio de sesión, recuperación de contraseña, cierre de sesión con confirmación, sesión persistente segura | CU-01 a CU-05, RF09 | Implementado (app + API) |
| B · Perfil: consultar, editar nombre/correo/teléfono, cambiar contraseña, idioma guardado en la cuenta | CU-06 a CU-08 | Implementado |
| C · Catálogo: listado paginado, categorías, productos por categoría, búsqueda por nombre o referencia, filtros por categoría y marca, sin resultados, detalle con características | CU-09 a CU-15 | Implementado |
| D · Gestión de productos: listado con activos/inactivos, alta, edición (incluye precio y stock), desactivar/reactivar, imagen | CU-16 a CU-21 | Implementado |
| E · Gestión de categorías: crear, editar, desactivar/reactivar | CU-22 a CU-24 | Implementado |
| F · Gestión de usuarios: listado (con rol y nº de pedidos), detalle, activar/desactivar | CU-25 a CU-27 | Implementado |

### 5.2 Ampliación v2 (pantallas de Figma fuera del MVP)

| Pantalla de Figma | Qué hace | Datos |
| --- | --- | --- |
| **Carrito** (21) | Agregar desde el catálogo ("+") o el detalle, cambiar cantidades, quitar, totales, aviso de stock insuficiente | `cart_items` |
| **Finalizar compra** | Dirección, método de pago (tarjeta, transferencia o crédito empresarial), notas y confirmación. Descuenta stock en una transacción | `orders`, `order_items` |
| **Mis pedidos** (4) + detalle | Historial con filtros, estado (Pendiente → En proceso → Enviado → Completado), cancelación con reposición de stock | `orders` |
| **Mis direcciones** (9) | Alta, edición, eliminación y dirección principal | `addresses` |
| **Métodos de pago** (7) | Alta de tarjeta (validación Luhn y vencimiento), eliminación, datos de transferencia | `payment_methods` |
| **Ayuda y soporte** (8) | Preguntas frecuentes y mensaje al equipo | `support_messages` |
| **Términos y privacidad** (11) | Términos, privacidad, cookies, devoluciones, versión y solicitud de eliminación de cuenta | textos en la app |
| **Dashboard** (12) | Ventas de hoy (vs. ayer), pedidos activos, ventas de la semana, últimos pedidos, top productos | consultas sobre `orders` |
| **Pedidos** del panel (14) | Filtros por estado, búsqueda, detalle y "Actualizar" (solo transiciones válidas) | `orders` |
| **Reportes** (24) | Resumen mensual (ventas, completados, nuevos usuarios, conversión, ticket promedio), ventas por categoría, exportar **PDF** y **Excel (CSV)** | consultas sobre `orders` |
| **Empresa · Mi Empresa** (16) | Crédito (límite, usado, disponible), pedidos y monto del mes, facturas pendientes, puntos, actividad reciente | `companies` |
| **Empresa · Pedido masivo** (17) | Cantidades por producto con descuentos por volumen (+50 u. 5 %, +100 u. 10 %, +500 u. 18 %) | `orders` |
| **Empresa · Facturación** (18) | Facturas por pagar, pagadas y vencidas; **Ver PDF** y **Pagar ahora** | `invoices` |
| **Empresa · Mis contactos** (19) | Equipo de cuenta con **Llamar** y **WhatsApp** | `account_contacts` |
| **Empresa · Mi cuenta** (22) | Datos fiscales, usuarios de la cuenta, domicilios, métodos de pago, historial, seguridad, soporte | `companies`, `users` |

**Importante — pagos simulados.** No hay pasarela de pago. El pago con tarjeta se aprueba si la tarjeta es del usuario y no está vencida; "Pagar ahora" marca la factura como pagada. De las tarjetas solo se guardan marca y últimos 4 dígitos (nunca el número completo ni el CVV). Para cobrar de verdad habría que integrar una pasarela (Wompi, Mercado Pago, Stripe…).

Reglas de la ampliación: el crédito y el descuento por volumen son solo para el rol Empresa; las compras de empresa a crédito o por transferencia generan una factura pendiente (30 días) y consumen crédito; pagar la factura lo libera; cada $10 suman 1 punto. El administrador no compra (no ve Carrito ni Pedidos propios).

Navegación (como en Figma):
- **Usuario:** **Inicio · Catálogo · Carrito · Pedidos · Perfil** (la búsqueda está en el ícono 🔍 del catálogo).
- **Empresa:** botón **Empresa** en el inicio de sesión → **Empresa · Masivo · Facturas · Contacto · Cuenta**.
- **Administrador:** botón **Admin** → **Dashboard · Productos · Pedidos · Usuarios · Reportes · Mi cuenta** (categorías desde Productos o Dashboard).
- Las zonas están protegidas en la app (`Stack.Protected`) y en la API (roles `user`, `company`, `admin`).

## 6. API REST

Todas las rutas cuelgan de `/api`. Errores uniformes: `{ "error": { "code", "message", "details?" } }`. Detalle completo en [`zertica-backend/README.md`](zertica-backend/README.md).

| Método y ruta | Acceso | Descripción |
| --- | --- | --- |
| `GET /health` | público | Estado de la API y de MySQL (200 / 503) |
| `POST /auth/register` · `/auth/login` · `/auth/forgot-password` · `/auth/reset-password` | público | Registro, sesión (JWT, con usuario o correo) y recuperación |
| `POST /auth/logout` | sesión | Cierre de sesión |
| `GET /me` · `PATCH /me` · `PUT /me/password` | sesión | Perfil, idioma y contraseña |
| `GET /products` | sesión | **Contrato documentado**: `page`, `limit`, `search`, `category_id`, `brand_id` → `{ data, meta }` (v2 añade `price` y `stock` a cada producto, sin quitar nada) |
| `GET /products/:id` | sesión | Detalle con `features` |
| `GET /categories` · `GET /brands` | sesión | Categorías activas y marcas |
| `GET /orders/stats` | cliente | Nº de pedidos y total gastado (perfil) |
| `GET/POST/PATCH/DELETE /cart…` | usuario, empresa | Carrito |
| `GET /orders` · `GET /orders/:id` · `POST /orders` · `POST /orders/:id/cancel` | usuario, empresa | Mis pedidos y compra desde el carrito |
| `POST /orders/bulk` | empresa | Pedido masivo |
| `/addresses` · `/payment-methods` · `POST /support/messages` | sesión | Direcciones, tarjetas y ayuda |
| `GET /company` · `/company/invoices` · `POST /company/invoices/:id/pay` · `/company/contacts` · `/company/users` | empresa | Portal Empresa |
| `GET /admin/summary` | admin | Dashboard (ventas, pedidos, semana, top productos, conteos) |
| `GET /admin/orders` · `GET /admin/orders/:id` · `PATCH /admin/orders/:id/status` | admin | Pedidos del panel |
| `GET /admin/reports?month=AAAA-MM` · `GET /admin/reports/export.csv` | admin | Reportes y exportación |
| `/admin/products` · `/admin/categories` · `/admin/users` | admin | Gestión (listar, crear, editar, activar/desactivar, imagen) |

## 7. Generar el APK

**Opción A — EAS Build (en la nube, sin Android Studio):**

```bash
cd zertica-app
npm install -g eas-cli
eas login
eas init                                   # vincula el proyecto a tu cuenta Expo (solo la primera vez)
# Edita eas.json → build.preview.env.EXPO_PUBLIC_API_URL con la URL de tu backend
eas build --platform android --profile preview
```

Al terminar, EAS muestra un enlace para descargar el `.apk` e instalarlo en el teléfono.

**Opción B — Compilación local (Android Studio + JDK 17):**

```bash
cd zertica-app
echo "EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api" > .env   # URL que usará el APK
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

La variante `release` generada por Expo se firma con la clave de depuración, válida para instalar y probar. Para publicar en Google Play, configura tu propia clave de firma (ver la documentación de Expo).

## 8. Pruebas realizadas

- **Backend:** `npm test` en `zertica-backend` ejecuta **25 pruebas de integración** contra MySQL real (14 del MVP + 11 de la ampliación: roles, direcciones, tarjetas, carrito, compra, cancelación, pedido masivo con descuento y límite de crédito, facturas, ayuda, pedidos y reportes del panel). MVP: autenticación (usuario o correo), cuentas desactivadas, política de contraseñas, resumen del panel, registro y unicidad, contrato de `/api/products` (incluido el ejemplo `search=PLC&category_id=1` → 2), comodines `%`, paginación y límites, detalle, perfil, cambio y recuperación de contraseña, permisos por rol, productos con imagen, categorías y usuarios. **Atención:** reinicia la base de datos.
- **App:** `npm run typecheck` y `npm run lint` sin errores; el bundle Android (Hermes) compila con `npx expo export --platform android`. La generación nativa (`expo prebuild`) se verificó antes de la ampliación v2; tras añadir `expo-print`, `expo-sharing` y `expo-file-system` no se volvió a ejecutar en este entorno.
- **De punta a punta:** se recorrieron con un navegador automatizado, contra el backend y MySQL reales, los flujos de idioma, inicio de sesión (correcto, incorrecto, cuenta desactivada), acceso administrativo (incluido el rechazo de una cuenta sin rol admin), registro con validaciones y duplicados, recuperación de contraseña, catálogo, categoría, filtro por marca, búsqueda con y sin resultados, detalle, perfil, cambio de idioma, cierre de sesión con confirmación, alta de producto con imagen, desactivación de productos, categorías (incluido nombre duplicado) y desactivación de usuarios.
- **Ampliación v2, de punta a punta:** compra completa (agregar desde el catálogo y el detalle, carrito, finalizar compra, pedido, cancelación), direcciones, tarjeta inválida y válida, ayuda, términos; portal Empresa (acceso que rechaza cuentas no empresariales, pedido masivo con 10 % de descuento a crédito, pago de factura, contactos, cuenta); panel (Dashboard, actualizar estado de un pedido, usuarios, reportes y descarga del CSV).
- **Pendiente de verificar en un dispositivo/emulador Android real:** no se ejecutó en hardware Android en este entorno. En particular conviene probar allí "Ver PDF"/"Exportar PDF" (`expo-print` + compartir), "Llamar" y "WhatsApp".

## 9. Diseño visual (Figma)

La interfaz sigue el archivo de Figma del proyecto (24 pantallas, exportadas a PDF; el enlace no dio acceso a la cuenta conectada): colores (`#0F2044` azul marino, `#F5811E` naranja, `#F0F0F0` fondo), encabezados azul marino con logotipo, tarjetas blancas redondeadas, chips, pastillas de estado, íconos de color y barra inferior azul marino. Los tokens están en `zertica-app/src/theme.ts`.

Las **24 pantallas** de Figma están implementadas (las de la ampliación v2 se listan en la sección 5.2). Diferencias deliberadas:
- La campana de notificaciones y las opciones de foto de perfil, fecha de nacimiento, género, verificación en 2 pasos y sesiones activas no se implementaron: no hay datos ni casos de uso para ellas.
- Notificaciones, configuración general e historial de actividad del administrador tampoco (no hay requisitos).
- "Eliminar mi cuenta" envía una solicitud al soporte en lugar de borrar datos (RN07: no se eliminan registros).

Pantallas de la app que no están en Figma (detalle de producto, registro, recuperación, categorías del panel, formularios de producto/categoría) usan el mismo sistema visual.

## 10. Decisiones técnicas (propuestas)

Decisiones pendientes de la especificación (sección 18) resueltas con la opción sugerida o la más coherente:

| # | Decisión | Solución aplicada |
| --- | --- | --- |
| 2 | Identificador de inicio de sesión | Nombre de usuario **o** correo (Figma pide correo; los casos de uso, usuario) |
| 3 | Mecanismo de sesión | JWT (8 h) sin tabla adicional; el token se guarda en el almacén seguro de Android (`expo-secure-store`) y el backend revisa en cada petición que la cuenta siga activa |
| 4 | Alta de cuentas | Registro libre; la cuenta queda activa y el administrador puede desactivarla |
| 5 | Middleware de autenticación | Aplicado a todas las rutas salvo salud, registro, login y recuperación |
| 6 | Administrador y bcrypt | `bcrypt` incluido; script `npm run seed:admin` |
| 7 | Servicio de correo | SMTP opcional (`nodemailer`). Sin SMTP, en desarrollo el código de recuperación se devuelve en la respuesta y se muestra en la consola del servidor; en producción no |
| 8 | Imágenes | Archivo subido (JPG/PNG/WEBP, máx. 5 MB) guardado en `uploads/` y servido por la API; obligatoria al crear y opcional al editar |
| 9 | Marcas y características | Cargadas por script (sin pantallas de gestión, como en los casos de uso) |
| 10 | Descripción de categoría (CU-23) | No se agregó columna: se respetan las 5 tablas originales; se edita el nombre |
| 11 | Nombre completo | Incluido en el registro |
| 13 | Rutas de la API | Prefijo `/api` en inglés |
| 14 | Búsqueda | `LIKE` sobre referencia y nombre, con comodines escapados |
| 15 | Autodesactivación del administrador | Bloqueada |
| — | Contraseñas | Regla de la pantalla Seguridad de Figma: mínimo 8 caracteres, una mayúscula, un número y un carácter especial |
| — | Acceso administrativo | Pantalla separada (Figma); rechaza cuentas sin rol admin con `NOT_ADMIN` |
| — | Resumen del panel | `GET /api/admin/summary`: solo conteos de las 5 tablas |
