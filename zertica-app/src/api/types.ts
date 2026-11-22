export type Role = 'user' | 'admin' | 'company';
export type Language = 'es' | 'en';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  companyId: number | null;
  ordersCount?: number;
  language: Language;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

export interface NamedRef {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  reference: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
  category: NamedRef;
  brand: NamedRef;
}

export interface ProductFeature {
  id: number;
  name: string;
  value: string;
}

export interface ProductDetail extends Product {
  features: ProductFeature[];
}

export interface AdminProduct extends ProductDetail {
  category: NamedRef & { isActive: boolean };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  productCount: number;
}

export interface AdminCategory extends Category {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Brand = NamedRef;

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface FieldError {
  field: string;
  code: string;
}

export type StatusFilter = 'all' | 'active' | 'inactive';

// ---- Ampliación v2 ----
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
export type PaymentType = 'card' | 'transfer' | 'credit';

export interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
  available: boolean;
  enoughStock: boolean;
}

export interface VolumeTier {
  minQuantity: number;
  percent: number;
}

export interface Totals {
  itemCount: number;
  subtotal: number;
  discountPercent: number;
  discount: number;
  total: number;
}

export interface Cart extends Totals {
  items: CartItem[];
  volumeTiers: VolumeTier[];
}

export interface OrderItem {
  productId: number;
  name: string;
  reference: string;
  categoryName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order extends Totals {
  id: number;
  code: string;
  status: OrderStatus;
  paymentType: PaymentType;
  paymentLabel: string;
  shippingAddress: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: number; fullName: string; username: string };
  company: NamedRef | null;
  invoice: { code: string; status: InvoiceStatus } | null;
  allowedTransitions: OrderStatus[];
  items?: OrderItem[];
}

export interface Address {
  id: number;
  label: string;
  line1: string;
  city: string;
  postalCode: string | null;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: number;
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
  brandName: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
  isDefault: boolean;
  isExpired: boolean;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: number;
  code: string;
  orderId: number;
  orderCode: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
}

export interface Company {
  id: number;
  name: string;
  legalName: string;
  taxId: string;
  taxRegime: string;
  fiscalAddress: string;
  phone: string;
  email: string;
  tier: 'standard' | 'premium';
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  points: number;
}

export interface CompanyOverview {
  company: Company;
  stats: { ordersThisMonth: number; amountThisMonth: number; pendingInvoices: number; points: number };
  activity: { type: string; reference: string; amount: number; at: string; orderId?: number }[];
}

export interface InvoiceDetail {
  code: string;
  status: InvoiceStatus;
  amount: number;
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  company: Company;
  order: Totals & { code: string; shippingAddress: string; items: Omit<OrderItem, 'productId' | 'categoryName'>[] };
}

export interface Contact {
  id: number;
  fullName: string;
  title: string;
  phone: string;
}

export interface SalesReport {
  month: string;
  totalSales: number;
  orders: number;
  completedOrders: number;
  newUsers: number;
  conversionRate: number;
  averageTicket: number;
  salesByCategory: { category: string; total: number; units: number }[];
  salesByDay: { day: string; total: number; orders: number }[];
}
