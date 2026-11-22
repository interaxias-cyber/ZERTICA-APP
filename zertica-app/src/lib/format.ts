import type { Language } from '@/api/types';

/** Moneda: $ con separadores locales (sin decimales si es entero). */
export function money(value: number, language: Language = 'es') {
  const n = Number(value) || 0;
  const hasCents = Math.round(n * 100) % 100 !== 0;
  return `$${n.toLocaleString(language === 'es' ? 'es-CO' : 'en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

const MONTHS: Record<Language, string[]> = {
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** "25 Sep 2026" como en Figma. Las fechas "AAAA-MM-DD" se toman sin zona horaria. */
export function shortDate(value: string | Date, language: Language = 'es', withYear = true) {
  const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${MONTHS[language][d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`;
}

export function monthLabel(month: string, language: Language = 'es') {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[language][m - 1]} ${y}`;
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
