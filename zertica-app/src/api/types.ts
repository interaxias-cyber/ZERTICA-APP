export type Role = 'user' | 'admin';
export type Language = 'es' | 'en';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: Role;
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
