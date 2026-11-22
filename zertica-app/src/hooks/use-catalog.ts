import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { catalogApi, type ProductQuery } from '@/api/catalog';
import { PAGE_SIZE } from '@/config/env';

export const catalogKeys = {
  products: (q: ProductQuery) => ['products', q] as const,
  product: (id: number) => ['product', id] as const,
  categories: ['categories'] as const,
  brands: ['brands'] as const,
};

/** CU-09/10/11/13: listado paginado con scroll infinito. */
export function useProducts(query: Omit<ProductQuery, 'page'>, enabled = true) {
  return useInfiniteQuery({
    queryKey: catalogKeys.products(query),
    queryFn: ({ pageParam, signal }) => catalogApi.products({ ...query, page: pageParam, limit: PAGE_SIZE }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled,
  });
}

/** CU-12 */
export function useCategories() {
  return useQuery({ queryKey: catalogKeys.categories, queryFn: catalogApi.categories, staleTime: 5 * 60_000 });
}

export function useBrands() {
  return useQuery({ queryKey: catalogKeys.brands, queryFn: catalogApi.brands, staleTime: 5 * 60_000 });
}

/** CU-14/15 */
export function useProduct(id: number) {
  return useQuery({ queryKey: catalogKeys.product(id), queryFn: () => catalogApi.product(id), enabled: id > 0 });
}
