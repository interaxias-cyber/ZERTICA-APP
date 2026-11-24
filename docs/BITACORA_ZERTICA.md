# Bitácora del proyecto ZERTICA – Drywall Shop (Android)

> Registro completo del desarrollo de la aplicación móvil **Zertica – Drywall Shop** para Android: requerimientos, decisiones, arquitectura, características técnicas, pruebas, despliegue, incidencias y estado final.

| Dato | Valor |
|---|---|
| Proyecto | Zertica – Drywall Shop (tienda de materiales de drywall) |
| Plataforma | Android (APK nativo generado con Expo / React Native) |
| Repositorio | `interaxias-cyber/ZERTICA-APP` (rama `main`) |
| Periodo registrado | 22 al 24 de noviembre de 2026 |
| Versión | 1.0.0 (versionCode 1) |
| Paquete Android | `com.zertica.drywallshop` |
| Dispositivo de prueba | Samsung Galaxy S26+ |
| Componentes | `zertica-app/` (app móvil) y `zertica-backend/` (API REST + base de datos) |

---

## 1. Objetivo del proyecto

Construir una aplicación Android para la venta de materiales de drywall (placas, perfiles, tornillería, masillas, accesorios) con tres perfiles de uso:

- **Cliente (user):** explora el catálogo, compra con carrito, paga (simulado) y sigue sus pedidos.
- **Administrador (admin):** gestiona productos, categorías, usuarios y pedidos, y consulta reportes de ventas.
- **Empresa (company):** compra por volumen con descuentos escalonados, crédito a 30 días, facturas, contactos y puntos.

La app consume una API REST propia (Node.js + Express) conectada a MySQL/MariaDB. El backend puede ejecutarse en un PC de la red local **o dentro del mismo celular con Termux**, de modo que la app funciona sin depender de una computadora.

---

## 2. Registro cronológico

### Día 1 – 22 nov 2026

| Hora | Actividad | Resultado |
|---|---|---|
| — | Instalación del plugin oficial de Expo para Claude Code (repo `expo/skills`) y verificación de Expo MCP. | Skills de Expo disponibles; no se tocaron otras skills/plugins. |
| — | Conexión del repositorio GitHub mediante la GitHub App. | Clonado y con permisos de push. |
| — | Revisión de la documentación entregada: especificación integral, casos de uso, diagramas y prompts. | Se decide usar **Expo** (en lugar de Flutter) por indicación del usuario. |
| 06:48 | **Commit 1 – MVP:** app Android (Expo) y backend Express + MySQL con las 5 tablas originales y el contrato `GET /api/products`. | Login, registro, recuperación de contraseña, catálogo, detalle, búsqueda y panel admin de productos/categorías/usuarios. |
| 07:41 | **Commit 2 – Figma:** alineación con el PDF de 24 pantallas (colores, tipografía, tarjetas, precios y fotos de producto). | El enlace de Figma no dio acceso; se trabajó con el PDF. |
| 16:19 | **Commit 3 – Ampliación v2:** carrito, checkout, Mis pedidos, métodos de pago, direcciones, ayuda, términos; Pedidos y Reportes del panel; 6 pantallas del rol Empresa. BD ampliada a 14 tablas. | 25/25 pruebas aprobadas. |
| 17:03 | **Commit 4:** pantalla ⚙️ *Servidor* para configurar la URL del backend desde la app; instrucciones del APK. | La IP ya no queda fija en el código. |
| — | Compilación local del APK (Android SDK, JDK 17, Gradle 9.4.1). | `Zertica-1.0.0.apk` (35 MB) entregado e instalado en el S26+. |
| — | Conexión con el backend en el PC Windows. | Funcionó usando el punto de acceso del celular (IP 192.168.40.99). |

### Día 2 – 23 nov 2026

| Hora | Actividad | Resultado |
|---|---|---|
| 02:48 | **Commit 5:** backend dentro del celular con **Termux + MariaDB** (script de instalación automática). | App 100 % autónoma en el teléfono. |
| 03:20 | **Commit 6:** corrección del error `ERROR 1227 (CREATE USER)` detectando el usuario administrador real de MariaDB. | Instalación completada. |
| 17:40 | **Commit 7:** `docs/INFORME_ZERTICA.md` – informe técnico/funcional, prompt para Claude Design y guion de video. | Material para la presentación. |

### Día 3 – 24 nov 2026

| Hora | Actividad | Resultado |
|---|---|---|
| 14:34 | **Commit 8:** `bcryptjs` como alternativa cuando `bcrypt` nativo no compila en Termux. | Error `bcrypt_lib.node` resuelto. |
| 14:39 | **Commit 9:** comando `zertica-db-demo` – recorrido guiado de la BD para la exposición. | Funcionó en el celular. |
| 14:59 | **Commit 10:** `zertica` detecta si el backend ya está encendido (evita `EADDRINUSE`). | — |
| 15:16 | **Commit 11:** `zertica-stop` apaga backend, MariaDB y wake-lock (ahorro de batería y RAM). | — |
| — | Bitácora del proyecto (este documento, en Markdown y Word). | — |
| — | **Commit 13:** `zertica-db-demo` cuenta las filas con `COUNT(*)` y la sección de usuarios muestra nombre, correo, contraseña de prueba, empresa y estado. | Los usuarios nuevos aparecen al instante. |

---

## 3. Requerimientos

### 3.1 Requerimientos funcionales (resumen de RF01–RF45)

| Módulo | Requerimientos |
|---|---|
| Autenticación | Registro con validación; login por usuario o correo; login separado para Admin y Empresa; recuperación y restablecimiento de contraseña con token de un solo uso; cierre de sesión; cambio de contraseña. |
| Catálogo | Listado de productos con imagen, precio y stock; filtros por categoría y marca; búsqueda; detalle con características técnicas; productos destacados. |
| Carrito y compra | Agregar, modificar y quitar productos; validación de stock; checkout con dirección y método de pago; pago simulado; generación de código de pedido. |
| Pedidos del cliente | Historial, detalle, estado (pendiente → confirmado → enviado → entregado / cancelado), cancelación, estadísticas. |
| Perfil | Editar datos, direcciones (CRUD, predeterminada), métodos de pago (tarjeta validada con Luhn), idioma ES/EN, ayuda, términos, soporte. |
| Panel Admin | Dashboard (ventas, semana, últimos pedidos, top productos); CRUD de productos con foto; categorías; usuarios (activar/desactivar, rol); gestión de pedidos y cambio de estado; reportes por mes y exportación CSV/PDF. |
| Portal Empresa | Inicio con crédito y puntos; pedido por volumen con descuento escalonado; facturas (ver/exportar PDF); contactos (llamar/WhatsApp); usuarios de la empresa; cuenta. |

### 3.2 Requerimientos no funcionales (16)

| Tipo | Requerimiento |
|---|---|
| Plataforma | Android 7.0+ (API 24) hasta Android 16 (API 36). |
| Usabilidad | Interfaz fiel al diseño de Figma, en español e inglés (600+ textos). |
| Seguridad | Contraseñas con hash bcrypt; JWT con expiración de 8 h; control de acceso por rol; tarjetas sin número completo. |
| Rendimiento | Respuestas de la API < 1 s en red local; caché de consultas en la app (React Query). |
| Integridad | Claves foráneas, UNIQUE, CHECK y transacciones con bloqueo de fila para stock. |
| Disponibilidad | Backend ejecutable en PC o dentro del celular (Termux). |
| Mantenibilidad | Arquitectura por capas, TypeScript, lint y pruebas automatizadas. |
| Portabilidad | MySQL 8 o MariaDB 10.11+ sin cambios de código. |
| Configurabilidad | URL del servidor editable desde la app. |
| Validación | Validaciones en cliente y servidor con errores uniformes. |

### 3.3 Reglas de negocio destacadas (28 en total)

- Contraseña: mínimo 8 caracteres, una mayúscula, un número y un carácter especial.
- Usuarios inactivos no pueden iniciar sesión.
- No se puede comprar más que el stock disponible; el stock se descuenta en la transacción del pedido.
- Descuento por volumen **solo para Empresa**: +50 u → 5 %, +100 u → 10 %, +500 u → 18 %.
- Compras de Empresa a crédito generan factura con vencimiento a 30 días y consumen cupo.
- 1 punto por cada $10 de compra (Empresa).
- Solo se pueden cancelar pedidos pendientes/confirmados; se repone el stock.
- Las tarjetas se guardan solo como marca + últimos 4 dígitos.

---

## 4. Arquitectura

```
┌──────────────────────────────┐        HTTP/JSON (JWT)        ┌──────────────────────────────┐
│  App Android (Expo / RN)     │ ─────────────────────────────▶│  API REST Node.js + Express  │
│  Expo Router · React Query   │◀───────────────────────────── │  routes → middlewares →      │
│  SecureStore · i18n ES/EN    │                                │  controllers → validators →  │
└──────────────────────────────┘                                │  services → models           │
                                                                └──────────────┬───────────────┘
                                                                               │ mysql2 (pool 10)
                                                                ┌──────────────▼───────────────┐
                                                                │  MySQL 8 / MariaDB (14 tablas)│
                                                                └──────────────────────────────┘
```

**Escenarios de despliegue:**

1. **PC en red local:** backend y MySQL en Windows; el celular apunta a `http://IP_DEL_PC:3000/api`.
2. **Todo en el celular:** Termux ejecuta MariaDB + backend; la app apunta a `http://127.0.0.1:3000/api`.

---

## 5. Características técnicas Android

### 5.1 APK

| Parámetro | Valor |
|---|---|
| Nombre visible | Zertica |
| Paquete (applicationId) | `com.zertica.drywallshop` |
| Versión / versionCode | 1.0.0 / 1 |
| minSdk / targetSdk / compileSdk | 24 (Android 7.0) / 36 (Android 16) / 37 |
| ABI | arm64-v8a (todos los Android modernos de 64 bits) |
| Tamaño | ~35 MB |
| Motor JS | Hermes |
| Nueva arquitectura RN | Activada (Fabric + TurboModules) |
| Firma | APK Signature Scheme v2, clave de depuración (instalación directa, no Play Store) |
| Permisos | `INTERNET` únicamente (se eliminaron CAMERA y RECORD_AUDIO) |
| Tráfico HTTP | `usesCleartextTraffic=true` (expo-build-properties) para hablar con el backend local sin HTTPS |
| Esquema de enlaces | `zertica://` |
| Almacenamiento seguro | Token JWT en Android Keystore vía `expo-secure-store` |

### 5.2 Herramientas de compilación

| Herramienta | Versión |
|---|---|
| Expo SDK | 58 |
| React Native / React | 0.88 / 19.3 |
| TypeScript | 6 |
| Gradle | 9.4.1 |
| JDK | 17 (OpenJDK) |
| Android SDK Platform / Build-tools | 37 / 37.0.0 |
| NDK / CMake | 27.1.12297006 / 3.22.1 |

Proceso: `npx expo prebuild --platform android` → `./gradlew assembleRelease` → `app-release.apk`. También se dejó `eas.json` para compilar en la nube con EAS Build.

### 5.3 Librerías principales de la app

| Librería | Uso |
|---|---|
| expo-router | Navegación por archivos, pestañas, rutas protegidas por rol (`Stack.Protected`). |
| @tanstack/react-query | Peticiones, caché y refresco de datos. |
| expo-secure-store | Guardar el token y la URL del servidor. |
| expo-image-picker | Subir fotos de productos (galería). |
| expo-print + expo-sharing | Generar y compartir PDF (facturas, reportes). |
| expo-file-system | Exportar CSV. |
| expo-splash-screen | Pantalla de inicio. |

---

## 6. Módulos y pantallas (45 rutas)

| Zona | Pantallas |
|---|---|
| Acceso | Bienvenida/idioma, Login, Login Admin, Login Empresa, Registro, Olvidé contraseña, Restablecer contraseña, Servidor. |
| Cliente (pestañas) | Inicio, Catálogo, Carrito, Pedidos, Perfil. |
| Cliente (otras) | Detalle de producto, Categoría, Búsqueda, Checkout, Detalle de pedido, Historial, Direcciones, Métodos de pago, Ayuda, Términos, Editar perfil, Cambiar contraseña, Idioma. |
| Admin (pestañas) | Dashboard, Productos, Pedidos, Usuarios, Reportes, Cuenta. |
| Admin (otras) | Editar producto, Categorías, Detalle de pedido, Detalle de usuario. |
| Empresa (pestañas) | Inicio, Pedido por volumen, Facturas, Contactos, Cuenta. |
| Empresa (otras) | Usuarios de la empresa. |

Colores del diseño: azul marino `#0F2044` / `#1A3060`, naranja `#F5811E`, fondo `#F0F0F0`.

---

## 7. Base de datos (14 tablas)

| Grupo | Tablas |
|---|---|
| MVP (5) | `users`, `categories`, `brands`, `products`, `product_features` |
| v2 – compras (5) | `cart_items`, `orders`, `order_items`, `addresses`, `payment_methods` |
| v2 – empresa y soporte (4) | `companies`, `company_contacts`, `invoices`, `support_messages` |

Características:

- Motor InnoDB, `utf8mb4`, claves foráneas con `ON DELETE` adecuado, índices UNIQUE (referencia, usuario, correo) y restricciones CHECK (precio ≥ 0, stock ≥ 0, cantidades > 0).
- `order_items` guarda una copia del nombre, referencia, categoría y precio del producto, para que el historial no cambie si el producto se modifica.
- Datos de prueba (`seed.sql`): catálogo con precios y fotos de Figma, 6 usuarios, 2 empresas, 13 pedidos con fechas relativas y 6 facturas.
- Scripts: `npm run db:init` (crea esquema + datos + imágenes) y `npm run seed:admin`.

---

## 8. API REST (46 endpoints)

| Grupo | Rutas principales |
|---|---|
| Públicas | `GET /api/health`, `POST /api/auth/register`, `/login`, `/forgot-password`, `/reset-password` |
| Sesión | `GET/PATCH /api/me`, `GET /api/products`, `/categories`, `/brands` |
| Comercio | `/api/cart`, `/api/orders` (+ `/bulk`, `/stats`, cancelación), `/api/addresses`, `/api/payment-methods`, `/api/support` |
| Empresa | `/api/company` (resumen, facturas, contactos, usuarios) |
| Admin | `/api/admin/products`, `/categories`, `/users`, `/summary`, `/orders`, `/reports`, `/reports/export.csv` |

Formato de error uniforme: `{ "error": { "code", "message", "details" } }`.

---

## 9. Seguridad

- Hash de contraseñas con **bcrypt** (alternativa automática `bcryptjs` en Termux).
- **JWT** firmado (8 h, issuer `zertica-api`, audience `zertica-app`) guardado en el Keystore de Android.
- Autorización por rol en backend (`authorize('admin')`, `company`) y en la app (rutas protegidas).
- Token de recuperación de un solo uso (firmado con secreto + hash actual).
- Tarjetas validadas con Luhn y guardadas solo como marca + 4 últimos dígitos; pagos simulados.
- Subida de imágenes limitada a JPG/PNG/WEBP de hasta 5 MB.
- Consultas parametrizadas (sin inyección SQL).

---

## 10. Pruebas

| Tipo | Detalle | Resultado |
|---|---|---|
| Automatizadas backend | `node:test` – `api.test.js` (14) y `commerce.test.js` (11) | **25/25** en MySQL 8 y MariaDB |
| Estáticas app | TypeScript + ESLint | Sin errores |
| Manuales en dispositivo | Recorrido de los tres roles en el S26+ con backend en PC y en Termux | Correcto |
| Base de datos | `zertica-db-demo` (8 secciones, incluida prueba de integridad) | Correcto |

---

## 11. Despliegue y operación en el celular (Termux)

| Comando | Función |
|---|---|
| `bash setup.sh` | Instalación única: Node, MariaDB, Git, proyecto, BD y alias. |
| `zertica` | Enciende MariaDB + backend (con wake-lock). |
| `zertica-db-demo` | Recorrido guiado de la base de datos. |
| `zertica-db-demo usuarios` | Solo la lista de usuarios (administradores, empresas y clientes) con correo y contraseña de prueba. |
| `zertica-db` | Consola SQL libre. |
| `zertica-reset` | Reinicia la BD con los datos de prueba. |
| `zertica-stop` | Apaga backend, MariaDB y libera el wake-lock. |

En la app: ⚙️ **Servidor** → `127.0.0.1` → Probar conexión → Guardar.

### Usuarios de prueba

| Perfil | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `Admin2026#` |
| Cliente | `juan` / `maria` | `Usuario2026#` |
| Cliente inactivo | `pedro` | `Inactivo2026#` |
| Empresa | `constructora` / `buildpro` | `Empresa2026#` |

Base de datos en Termux: usuario `zertica`, contraseña `Zertica2026`.

---

## 12. Incidencias y soluciones

| # | Problema | Causa | Solución |
|---|---|---|---|
| 1 | Ruta "/" sin coincidencia tras elegir idioma | Faltaba redirección por zona | Redirección por rol en `_layout`. |
| 2 | El admin aterrizaba en la tienda del cliente | Carrera entre login y navegación | `replace` diferido y control con `prevStatus`. |
| 3 | Alias SQL `lines` fallaba | Palabra reservada | Renombrado a `line_count`. |
| 4 | Gradle: error 429 de Maven Central | Límite de peticiones | Espejo de Google + reintentos. |
| 5 | Faltaba toolchain JDK 17 | Entorno de compilación | Instalación de OpenJDK 17. |
| 6 | `ECONNREFUSED 3306` en el PC | MySQL no instalado | Instalación de MySQL y `db:init`. |
| 7 | El celular no llegaba al PC | Red/aislamiento Wi-Fi | Usar el punto de acceso del celular. |
| 8 | `ERROR 1227 CREATE USER` en Termux | Usuario admin de MariaDB distinto de root | Detección automática del administrador. |
| 9 | `Cannot find module bcrypt_lib.node` | bcrypt nativo no compila en Termux | Alternativa `bcryptjs`. |
| 10 | `EADDRINUSE :3000` | Backend ya encendido en otra sesión | `zertica` lo detecta y avisa. |
| 11 | Tildes mal mostradas en la demo de BD | Juego de caracteres | `--default-character-set=utf8mb4`. |
| 12 | Consumo de batería con Termux | Wake-lock y servicios activos | Comando `zertica-stop`. |
| 13 | Se agregó un usuario y el conteo de la tabla `users` no cambiaba en la demo | `TABLE_ROWS` de InnoDB es una estimación que no se actualiza al instante | Conteo exacto con `COUNT(*)` en `zertica-db-demo`. |

### Lecciones aprendidas

- Dejar la URL del servidor configurable desde la app evita recompilar el APK.
- Tener una alternativa en JavaScript puro para dependencias nativas (bcrypt) facilita ejecutar el backend en Android.
- Los scripts idempotentes (se pueden repetir) simplifican la instalación en el teléfono.
- Guardar en el pedido una copia de los datos del producto protege el historial.

---

## 13. Cifras del proyecto

| Indicador | Valor |
|---|---|
| Archivos TS/TSX de la app | 143 (~9.900 líneas) |
| Rutas/pantallas | 45 |
| Archivos JS del backend | 46 (~2.900 líneas en `src`) |
| Endpoints | 46 |
| Tablas | 14 |
| Pruebas automatizadas | 25 (100 % aprobadas) |
| Textos traducidos ES/EN | 600+ |
| Requerimientos funcionales / no funcionales | 45 / 16 |
| Casos de uso | 27 + 12 |
| Reglas de negocio | 28 |
| Commits | 13 |

---

## 14. Estado final y pendientes

**Estado:** aplicación funcional e instalada en el Samsung S26+, con backend y base de datos ejecutándose en el propio celular (Termux) o en un PC.

**Pendiente / mejoras futuras:**

- Verificar en el dispositivo: exportar PDF, Llamar/WhatsApp desde Contactos, `zertica-stop`.
- Firma con clave de producción y publicación en Google Play (AAB).
- Pasarela de pagos real y HTTPS.
- Envío real de correos de recuperación (nodemailer configurado como opcional).
- Notificaciones push de cambio de estado del pedido.
- Compilación para otras arquitecturas (armeabi-v7a, x86_64) si se requiere.

---

*Documentos relacionados: `README.md` (instalación), `docs/INFORME_ZERTICA.md` (informe, prompt de presentación y guion de video).*
