import { PAGE_SIZE } from '@/config/env';
import { request } from './client';
import type {
  Address,
  Cart,
  CompanyOverview,
  Contact,
  Invoice,
  InvoiceDetail,
  Order,
  OrderStatus,
  Paginated,
  PaymentMethod,
  PaymentType,
} from './types';

export interface CheckoutInput {
  addressId: number;
  paymentType: PaymentType;
  paymentMethodId?: number;
  notes?: string;
  items?: { productId: number; quantity: number }[];
}

export interface AddressInput {
  label: string;
  line1: string;
  city: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface CardInput {
  number: string;
  expiry: string;
  cvv: string;
  holderName: string;
}

const data = <T,>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const cartApi = {
  get: () => data(request<{ data: Cart }>('/cart')),
  add: (productId: number, quantity = 1) => data(request<{ data: Cart }>('/cart/items', { method: 'POST', body: { productId, quantity } })),
  setQuantity: (productId: number, quantity: number) =>
    data(request<{ data: Cart }>(`/cart/items/${productId}`, { method: 'PATCH', body: { quantity } })),
  remove: (productId: number) => data(request<{ data: Cart }>(`/cart/items/${productId}`, { method: 'DELETE' })),
};

export const ordersApi = {
  list: ({ status = 'all', page = 1 }: { status?: OrderStatus | 'all' | 'active'; page?: number }) =>
    request<Paginated<Order>>('/orders', { query: { status, page, limit: PAGE_SIZE } }),
  get: (id: number) => data(request<{ data: Order }>(`/orders/${id}`)),
  stats: () => data(request<{ data: { orders: number; spent: number } }>('/orders/stats')),
  checkout: (input: CheckoutInput) => data(request<{ data: Order }>(input.items ? '/orders/bulk' : '/orders', { method: 'POST', body: input })),
  cancel: (id: number) => data(request<{ data: Order }>(`/orders/${id}/cancel`, { method: 'POST' })),
};

export const addressesApi = {
  list: () => data(request<{ data: Address[] }>('/addresses')),
  create: (input: AddressInput) => data(request<{ data: Address }>('/addresses', { method: 'POST', body: input })),
  update: (id: number, input: Partial<AddressInput>) => data(request<{ data: Address }>(`/addresses/${id}`, { method: 'PUT', body: input })),
  remove: (id: number) => request<void>(`/addresses/${id}`, { method: 'DELETE' }),
};

export const paymentsApi = {
  list: () => data(request<{ data: PaymentMethod[] }>('/payment-methods')),
  create: (input: CardInput) => data(request<{ data: PaymentMethod }>('/payment-methods', { method: 'POST', body: input })),
  remove: (id: number) => request<void>(`/payment-methods/${id}`, { method: 'DELETE' }),
};

export const supportApi = {
  send: (message: string) => data(request<{ data: { id: number } }>('/support/messages', { method: 'POST', body: { message } })),
};

export const companyApi = {
  overview: () => data(request<{ data: CompanyOverview }>('/company')),
  invoices: (status: 'all' | 'unpaid' = 'all') =>
    request<{ data: Invoice[]; meta: { unpaidCount: number; unpaidAmount: number } }>('/company/invoices', { query: { status } }),
  invoice: (id: number) => data(request<{ data: InvoiceDetail }>(`/company/invoices/${id}`)),
  pay: (id: number) => request<{ data: Invoice[] }>(`/company/invoices/${id}/pay`, { method: 'POST' }),
  contacts: () => data(request<{ data: Contact[] }>('/company/contacts')),
  users: () => data(request<{ data: { id: number; username: string; fullName: string; email: string; isActive: boolean }[] }>('/company/users')),
};
