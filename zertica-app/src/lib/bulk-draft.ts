import { useSyncExternalStore } from 'react';

/** Borrador del pedido masivo (pantalla "Masivo" → "Finalizar compra"). */
export interface DraftLine {
  quantity: number;
  price: number;
  name: string;
}
type Draft = Record<number, DraftLine>;

let draft: Draft = {};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Descuentos por volumen del rol Empresa (los mismos que aplica el backend). */
export const VOLUME_TIERS = [
  { minQuantity: 500, percent: 18 },
  { minQuantity: 100, percent: 10 },
  { minQuantity: 50, percent: 5 },
];

export function volumePercent(units: number) {
  return VOLUME_TIERS.find((t) => units >= t.minQuantity)?.percent ?? 0;
}

export const bulkDraft = {
  get: () => draft,
  set(productId: number, line: DraftLine) {
    const next: Draft = {};
    for (const [id, l] of Object.entries(draft)) {
      if (Number(id) !== productId) next[Number(id)] = l;
    }
    if (line.quantity > 0) next[productId] = line;
    draft = next;
    emit();
  },
  clear() {
    draft = {};
    emit();
  },
  items: () => Object.entries(draft).map(([id, l]) => ({ productId: Number(id), quantity: l.quantity })),
};

export function draftTotals(d: Draft) {
  const lines = Object.values(d);
  const units = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = Math.round(lines.reduce((s, l) => s + l.quantity * l.price, 0) * 100) / 100;
  const discountPercent = volumePercent(units);
  const discount = Math.round(subtotal * discountPercent) / 100;
  return { units, subtotal, discountPercent, discount, total: Math.round((subtotal - discount) * 100) / 100 };
}

export function useBulkDraft() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => draft,
    () => draft,
  );
}
