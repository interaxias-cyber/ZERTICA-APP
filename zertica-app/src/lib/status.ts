import type { InvoiceStatus, OrderStatus } from '@/api/types';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

/** Colores de estado del diseño: verde completado, ámbar en proceso, rojo cancelado. */
export const orderTone: Record<OrderStatus, Tone> = {
  pending: 'muted',
  processing: 'warning',
  shipped: 'info',
  completed: 'success',
  cancelled: 'danger',
};

export const invoiceTone: Record<InvoiceStatus, Tone> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'muted',
};
