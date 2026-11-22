import { PAGE_SIZE } from '@/config/env';
import { request } from './client';
import type { Brand, Category, Paginated, Product, ProductDetail } from './types';

export interface ProductQuery {
  search?: string;
  categoryId?: number | null;
  brandId?: number | null;
  page?: number;
  limit?: number;
}

export const catalogApi = {
  /** GET /api/products — contrato documentado (page, limit, search, category_id, brand_id). */
  products: ({ search, categoryId, brandId, page = 1, limit = PAGE_SIZE }: ProductQuery, signal?: AbortSignal) =>
    request<Paginated<Product>>('/products', {
      query: { page, limit, search: search?.trim(), category_id: categoryId, brand_id: brandId },
      signal,
    }),
  product: (id: number) => request<{ data: ProductDetail }>(`/products/${id}`).then((r) => r.data),
  categories: () => request<{ data: Category[] }>('/categories').then((r) => r.data),
  brands: () => request<{ data: Brand[] }>('/brands').then((r) => r.data),
};
