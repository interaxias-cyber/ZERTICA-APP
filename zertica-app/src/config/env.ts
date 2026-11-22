import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dirección del backend.
 * 0. La que el usuario guarde en la pantalla "Servidor" (APK instalado en un
 *    teléfono: se escribe la IP del PC donde corre el backend).
 * 1. EXPO_PUBLIC_API_URL (archivo .env) al compilar.
 * 2. En desarrollo: la IP del equipo que ejecuta Metro (sirve para dispositivo
 *    físico en la misma Wi-Fi y para el emulador).
 * 3. Emulador Android: 10.0.2.2 apunta al localhost del equipo.
 * 4. Web / iOS simulador: localhost.
 */
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3000';

function devHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri; // p. ej. "192.168.1.50:8081"
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const lan = __DEV__ ? devHost() : null;
  if (lan) return `http://${lan}:${API_PORT}/api`;
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}/api`;
  return `http://localhost:${API_PORT}/api`;
}

/** Dirección por defecto de esta compilación (sin la configurada por el usuario). */
export const DEFAULT_API_URL = resolveApiUrl();

let override: string | null = null;

/** Dirección efectiva del backend. */
export function getApiUrl(): string {
  return override ?? DEFAULT_API_URL;
}

/** Fija (o quita, con null) la dirección configurada por el usuario. */
export function setApiUrlOverride(url: string | null) {
  override = url ? normalizeApiUrl(url) : null;
}

/** "192.168.1.50" → "http://192.168.1.50:3000/api"; respeta lo que ya venga completo. */
export function normalizeApiUrl(input: string): string {
  let url = input.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  const m = /^(https?:\/\/[^/]+)(\/.*)?$/i.exec(url);
  if (!m) return url;
  let origin = m[1];
  const path = m[2] ?? '';
  if (!/:\d+$/.test(origin) && origin.startsWith('http://')) origin = `${origin}:${API_PORT}`;
  return `${origin}${path || '/api'}`;
}

/** Tiempo máximo de espera por petición (conexiones lentas). */
export const REQUEST_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS) || 20000;

export const PAGE_SIZE = 20;
