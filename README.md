# ZERTICA – Drywall Shop

Aplicación móvil Android para consultar y gestionar el catálogo de productos de construcción en seco de Zertica, conectada a un backend propio (Node.js + Express) y a una base de datos MySQL 8.

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

Creados por `database/seed.sql` (**solo desarrollo**; en la base se guarda únicamente el hash bcrypt):

| Usuario | Contraseña | Rol | Estado | Para qué sirve |
| --- | --- | --- | --- | --- |
| `admin` | `Admin123*` | admin | activo | Catálogo + panel de administración |
| `usuario` | `Usuario123*` | user | activo | Catálogo, búsqueda, filtros, perfil |
| `inactivo` | `Inactivo123*` | user | **desactivado** | Comprobar que una cuenta desactivada no entra (RN05) |

Otro administrador: `npm run seed:admin -- <usuario> <correo> <contraseña> "Nombre completo"`.

**Datos de catálogo de prueba:** 4 categorías, 3 marcas, 6 productos y 5 características, como indica la especificación. Los ejemplos explícitos de la documentación se respetan literalmente (`PLC-STD-12` · *Placa de yeso estándar 1/2"* · *Placas y paneles* · *Marca Alfa*; característica *Espesor 12.7 mm*; `search=PLC&category_id=1` devuelve 2 resultados). El resto de registros se reconstruyó a partir de la descripción del dominio (placas, perfilería, tornillería y masillas) porque el `schema.sql` original no estaba disponible. Los productos de ejemplo no tienen imagen (igual que los originales); el administrador puede cargarlas desde la app.

## 5. Funcionalidades

| Módulo | Casos de uso | Estado |
| --- | --- | --- |
| A · Acceso: idioma, registro con validación, inicio de sesión, recuperación de contraseña, cierre de sesión con confirmación, sesión persistente segura | CU-01 a CU-05, RF09 | Implementado (app + API) |
| B · Perfil: consultar, editar nombre/correo, cambiar contraseña, idioma guardado en la cuenta | CU-06 a CU-08 | Implementado |
| C · Catálogo: listado paginado (scroll infinito), categorías, productos por categoría, búsqueda por nombre o referencia, filtros por categoría y marca, sin resultados, detalle con características | CU-09 a CU-15 | Implementado |
| D · Gestión de productos: listado con activos/inactivos, alta, edición, desactivar/reactivar, cargar y reemplazar imagen | CU-16 a CU-21 | Implementado |
| E · Gestión de categorías: crear, editar, desactivar/reactivar | CU-22 a CU-24 | Implementado |
| F · Gestión de usuarios: listado, detalle, activar/desactivar | CU-25 a CU-27 | Implementado |

Fuera de alcance (no implementado, según la especificación): carrito, pedidos, cotizaciones, pagos, facturación, precio, stock, inventario, proveedores, contabilidad, IA y recomendaciones. La presentación muestra pantallas de carrito y pedidos; se excluyeron a propósito.

**Diferencia de alcance documentada.** La presentación marca registro, recuperación/cambio de contraseña y administración como "ideas no implementadas", mientras que los 27 casos de uso las incluyen. Este proyecto implementa los 27 casos de uso, organizados por módulos (tabla anterior).

Navegación: barra inferior con **Inicio · Catálogo · Buscar · Perfil**. El administrador ve además la tarjeta **Panel de administración** en Inicio y en Perfil; las rutas `/admin/*` están protegidas en la app (`Stack.Protected`) y en la API (rol `admin`).

## 6. API REST

Todas las rutas cuelgan de `/api`. Errores uniformes: `{ "error": { "code", "message", "details?" } }`. Detalle completo en [`zertica-backend/README.md`](zertica-backend/README.md).

| Método y ruta | Acceso | Descripción |
| --- | --- | --- |
| `GET /health` | público | Estado de la API y de MySQL (200 / 503) |
| `POST /auth/register` · `/auth/login` · `/auth/forgot-password` · `/auth/reset-password` | público | Registro, sesión (JWT) y recuperación |
| `POST /auth/logout` | sesión | Cierre de sesión |
| `GET /me` · `PATCH /me` · `PUT /me/password` | sesión | Perfil, idioma y contraseña |
| `GET /products` | sesión | **Contrato documentado**: `page`, `limit`, `search`, `category_id`, `brand_id` → `{ data, meta }` |
| `GET /products/:id` | sesión | Detalle con `features` |
| `GET /categories` · `GET /brands` | sesión | Categorías activas y marcas |
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

- **Backend:** `npm test` en `zertica-backend` ejecuta 13 pruebas de integración contra MySQL real: autenticación, cuentas desactivadas, registro y unicidad, contrato de `/api/products` (incluido el ejemplo `search=PLC&category_id=1` → 2), comodines `%`, paginación y límites, detalle, perfil, cambio y recuperación de contraseña, permisos por rol, productos con imagen, categorías y usuarios. **Atención:** reinicia la base de datos.
- **App:** `npm run typecheck` y `npm run lint` sin errores; el bundle Android (Hermes) compila con `npx expo export --platform android`; el proyecto nativo se genera con `expo prebuild` (permisos y `usesCleartextTraffic` verificados).
- **De punta a punta:** se recorrieron con un navegador automatizado, contra el backend y MySQL reales, los flujos de idioma, inicio de sesión (correcto, incorrecto, cuenta desactivada), registro con validaciones y duplicados, recuperación de contraseña, catálogo, categoría, filtro por marca, búsqueda con y sin resultados, detalle, perfil, cambio de idioma, cierre de sesión con confirmación, alta de producto con imagen, desactivación de productos, categorías (incluido nombre duplicado) y desactivación de usuarios.
- **Pendiente de verificar en un dispositivo/emulador Android real:** no se ejecutó en hardware Android en este entorno.

## 9. Diseño visual

El enlace de Figma no fue accesible (la cuenta conectada no tiene permiso sobre el archivo). La interfaz se construyó a partir de las **pantallas de la presentación "Zertica en desarrollo"** (inicio de sesión, catálogo y detalle): cabecera azul marino, acento naranja, tarjetas blancas con bordes redondeados, chips de categoría y barra inferior. El logotipo se extrajo de la presentación. **No se afirma que las pantallas reproduzcan Figma**; cuando el archivo esté disponible conviene contrastar las 24 pantallas y ajustar `zertica-app/src/theme.ts` y los componentes.

## 10. Decisiones técnicas (propuestas)

Decisiones pendientes de la especificación (sección 18) resueltas con la opción sugerida o la más coherente:

| # | Decisión | Solución aplicada |
| --- | --- | --- |
| 2 | Identificador de inicio de sesión | Nombre de usuario |
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
| — | Contraseñas | Mínimo 8 caracteres con letras y números |
