# zertica-app

App móvil Zertica – Drywall Shop para Android, hecha con **Expo SDK 58** (React Native + TypeScript + Expo Router).

```bash
npm install
cp .env.example .env    # opcional: EXPO_PUBLIC_API_URL
npx expo start          # Expo Go (QR) o "a" para el emulador Android
```

| Script | Descripción |
| --- | --- |
| `npm start` | Servidor de desarrollo |
| `npm run android` | Abre la app en el emulador / dispositivo Android |
| `npm run typecheck` / `npm run lint` | TypeScript y ESLint |
| `npm run apk:eas` | APK en la nube con EAS (perfil `preview`) |
| `npm run apk:local` | APK local (`expo prebuild` + Gradle; requiere Android SDK) |

La configuración de conexión, los usuarios de prueba y las instrucciones del APK están en el [README principal](../README.md).

## Estructura

```
src/
  app/                 Rutas (Expo Router) — solo rutas
    _layout.tsx        Proveedores + guardas: idioma → acceso → app
    language.tsx       Selección de idioma inicial
    (auth)/            login, register, forgot-password, reset-password
    (app)/(tabs)/      Inicio, Catálogo, Buscar, Perfil (barra inferior)
    (app)/product/[id] Detalle de producto
    (app)/category/[id] Productos de una categoría
    (app)/admin/       Panel, productos, categorías y usuarios (solo admin)
  screens/             Cuerpo de cada pantalla
  components/          Botones, campos, tarjetas, chips, estados vacíos/error…
  api/                 Cliente HTTP (timeout, errores, token) y servicios por módulo
  hooks/               React Query: catálogo y administración
  providers/           Sesión (AuthProvider) y caché (React Query)
  i18n/                Español e inglés; traduce los códigos de error de la API
  lib/                 Almacenamiento seguro, validaciones, confirmaciones
  config/env.ts        Resolución de la URL del backend
  theme.ts             Colores, tipografía, radios y sombras de la marca
```

- **Sesión:** el JWT se guarda en `expo-secure-store` (Keystore de Android). Si la API responde 401/403 de sesión, la app cierra la sesión y lo explica en la pantalla de acceso.
- **Errores:** cada código de error de la API se traduce (es/en); sin conexión o con tiempo agotado se muestra un mensaje con botón **Reintentar**.
- **Datos:** todo el catálogo viene de la API; no hay productos escritos en el código.
