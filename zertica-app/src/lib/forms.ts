import { ApiError } from '@/api/client';

export type FieldErrors = Record<string, string | undefined>;

/** Convierte los detalles de un VALIDATION_ERROR / conflicto en errores por campo. */
export function apiFieldErrors(error: unknown, translate: (code: string) => string, aliases: Record<string, string> = {}): FieldErrors {
  if (!(error instanceof ApiError)) return {};
  const out: FieldErrors = {};
  for (const { field, code } of error.fieldErrors) {
    const key = aliases[field] ?? field;
    if (!out[key]) out[key] = translate(code);
  }
  return out;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_RE = /^[A-Za-z0-9._-]{3,50}$/;
export const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
