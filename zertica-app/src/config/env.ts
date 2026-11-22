import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dirección del backend.
 * 1. EXPO_PUBLIC_API_URL (archivo .env) — siempre tiene prioridad.
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

export const API_URL = resolveApiUrl();

/** Tiempo máximo de espera por petición (conexiones lentas). */
export const REQUEST_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS) || 20000;

export const PAGE_SIZE = 20;
