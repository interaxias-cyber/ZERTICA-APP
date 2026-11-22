import { getApiUrl, REQUEST_TIMEOUT_MS } from '@/config/env';
import type { FieldError } from './types';

/** Error normalizado: el `code` coincide con el de la API (RN18) o es de red. */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get fieldErrors(): FieldError[] {
    return Array.isArray(this.details)
      ? (this.details as FieldError[]).filter((d) => d && typeof d.field === 'string')
      : [];
  }
}

let authToken: string | null = null;
let onSessionInvalid: ((code: string) => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** El proveedor de sesión se suscribe para cerrar sesión ante 401 / cuenta desactivada. */
export function setSessionInvalidHandler(handler: ((code: string) => void) | null) {
  onSessionInvalid = handler;
}

const SESSION_CODES = new Set(['UNAUTHORIZED', 'INVALID_TOKEN', 'SESSION_EXPIRED', 'ACCOUNT_DISABLED']);

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  form?: FormData;
  auth?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query) {
  const qs = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${getApiUrl()}${path}${qs ? `?${qs}` : ''}`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, form, auth = true, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  signal?.addEventListener('abort', () => controller.abort());

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = (err as Error)?.name === 'AbortError';
    if (aborted && signal?.aborted) throw err;
    throw new ApiError(0, aborted ? 'TIMEOUT' : 'NETWORK_ERROR', aborted ? 'Request timed out' : 'Network error');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return undefined as T;

  let payload: any = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const e = payload?.error;
    const error = new ApiError(
      response.status,
      e?.code ?? (response.status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN_ERROR'),
      e?.message ?? `HTTP ${response.status}`,
      e?.details,
    );
    if (auth && authToken && SESSION_CODES.has(error.code)) onSessionInvalid?.(error.code);
    throw error;
  }
  return payload as T;
}

/** Descarga texto (p. ej. CSV) con el token de sesión. */
export async function requestText(path: string, query?: Query): Promise<string> {
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), { headers });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error');
  }
  const text = await res.text();
  if (!res.ok) {
    let code = 'UNKNOWN_ERROR';
    try {
      code = JSON.parse(text)?.error?.code ?? code;
    } catch {}
    throw new ApiError(res.status, code, `HTTP ${res.status}`);
  }
  return text;
}
