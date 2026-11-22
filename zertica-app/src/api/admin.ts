import { Platform } from 'react-native';
import { PAGE_SIZE } from '@/config/env';
import { request } from './client';
import type { AdminCategory, AdminProduct, Paginated, Role, StatusFilter, User } from './types';

export interface PickedImage {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}

export interface ProductInput {
  reference?: string;
  name?: string;
  description?: string;
  categoryId?: number;
  brandId?: number;
  image?: PickedImage | null;
}

async function toFormData(input: ProductInput): Promise<FormData> {
  const form = new FormData();
  if (input.reference !== undefined) form.append('reference', input.reference);
  if (input.name !== undefined) form.append('name', input.name);
  if (input.description !== undefined) form.append('description', input.description);
  if (input.categoryId !== undefined) form.append('category_id', String(input.categoryId));
  if (input.brandId !== undefined) form.append('brand_id', String(input.brandId));
  if (input.image) {
    const type = input.image.mimeType || 'image/jpeg';
    const ext = type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const name = input.image.fileName || `producto.${ext}`;
    if (Platform.OS === 'web') {
      const blob = await (await fetch(input.image.uri)).blob();
      form.append('image', blob, name);
    } else {
      // React Native acepta { uri, name, type } como archivo multipart.
      form.append('image', { uri: input.image.uri, name, type } as unknown as Blob);
    }
  }
  return form;
}

export interface AdminProductQuery {
  search?: string;
  status?: StatusFilter;
  categoryId?: number | null;
  page?: number;
}

export interface AdminSummary {
  products: { total: number; active: number; inactive: number; withoutImage: number };
  categories: { total: number; active: number; inactive: number };
  brands: { total: number };
  users: { total: number; active: number; inactive: number; admins: number };
}

export const adminApi = {
  summary: () => request<{ data: AdminSummary }>('/admin/summary').then((r) => r.data),
  products: ({ search, status = 'all', categoryId, page = 1 }: AdminProductQuery) =>
    request<Paginated<AdminProduct>>('/admin/products', {
      query: { search: search?.trim(), status, category_id: categoryId, page, limit: PAGE_SIZE },
    }),
  product: (id: number) => request<{ data: AdminProduct }>(`/admin/products/${id}`).then((r) => r.data),
  createProduct: async (input: ProductInput) =>
    request<{ data: AdminProduct }>('/admin/products', { method: 'POST', form: await toFormData(input) }).then((r) => r.data),
  updateProduct: async (id: number, input: ProductInput) =>
    request<{ data: AdminProduct }>(`/admin/products/${id}`, { method: 'PUT', form: await toFormData(input) }).then((r) => r.data),
  setProductStatus: (id: number, isActive: boolean) =>
    request<{ data: AdminProduct; warning?: { code: string } }>(`/admin/products/${id}/status`, {
      method: 'PATCH',
      body: { isActive },
    }),

  categories: () => request<{ data: AdminCategory[] }>('/admin/categories').then((r) => r.data),
  category: (id: number) => request<{ data: AdminCategory }>(`/admin/categories/${id}`).then((r) => r.data),
  createCategory: (name: string) =>
    request<{ data: AdminCategory }>('/admin/categories', { method: 'POST', body: { name } }).then((r) => r.data),
  updateCategory: (id: number, name: string) =>
    request<{ data: AdminCategory }>(`/admin/categories/${id}`, { method: 'PUT', body: { name } }).then((r) => r.data),
  setCategoryStatus: (id: number, isActive: boolean) =>
    request<{ data: AdminCategory }>(`/admin/categories/${id}/status`, { method: 'PATCH', body: { isActive } }).then(
      (r) => r.data,
    ),

  users: ({ search, status = 'all', role, page = 1 }: { search?: string; status?: StatusFilter; role?: Role; page?: number }) =>
    request<Paginated<User>>('/admin/users', { query: { search: search?.trim(), status, role, page, limit: PAGE_SIZE } }),
  user: (id: number) => request<{ data: User }>(`/admin/users/${id}`).then((r) => r.data),
  setUserStatus: (id: number, isActive: boolean) =>
    request<{ data: User }>(`/admin/users/${id}/status`, { method: 'PATCH', body: { isActive } }).then((r) => r.data),
};
