import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type AdminProductQuery, type ProductInput } from '@/api/admin';
import type { OrderStatus, StatusFilter } from '@/api/types';

export const adminKeys = {
  summary: ['admin', 'summary'] as const,
  products: (q: Omit<AdminProductQuery, 'page'>) => ['admin', 'products', q] as const,
  product: (id: number) => ['admin', 'product', id] as const,
  categories: ['admin', 'categories'] as const,
  category: (id: number) => ['admin', 'category', id] as const,
  users: (q: { search?: string; status?: StatusFilter }) => ['admin', 'users', q] as const,
  user: (id: number) => ['admin', 'user', id] as const,
};

/** Tras cambiar datos del catálogo se invalidan también las vistas de usuario. */
function useInvalidateCatalog() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['admin'] }),
      qc.invalidateQueries({ queryKey: ['products'] }),
      qc.invalidateQueries({ queryKey: ['product'] }),
      qc.invalidateQueries({ queryKey: ['categories'] }),
    ]);
}

export function useAdminProducts(q: Omit<AdminProductQuery, 'page'>) {
  return useInfiniteQuery({
    queryKey: adminKeys.products(q),
    queryFn: ({ pageParam }) => adminApi.products({ ...q, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
}

export function useAdminProduct(id: number | null) {
  return useQuery({ queryKey: adminKeys.product(id ?? 0), queryFn: () => adminApi.product(id!), enabled: !!id });
}

export function useSaveProduct(id: number | null) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (input: ProductInput) => (id ? adminApi.updateProduct(id, input) : adminApi.createProduct(input)),
    onSuccess: invalidate,
  });
}

export function useProductStatus() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => adminApi.setProductStatus(id, isActive),
    onSuccess: invalidate,
  });
}

export function useAdminCategories() {
  return useQuery({ queryKey: adminKeys.categories, queryFn: adminApi.categories });
}

export function useSaveCategory(id: number | null) {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (name: string) => (id ? adminApi.updateCategory(id, name) : adminApi.createCategory(name)),
    onSuccess: invalidate,
  });
}

export function useCategoryStatus() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => adminApi.setCategoryStatus(id, isActive),
    onSuccess: invalidate,
  });
}

export function useAdminUsers(q: { search?: string; status?: StatusFilter }) {
  return useInfiniteQuery({
    queryKey: adminKeys.users(q),
    queryFn: ({ pageParam }) => adminApi.users({ ...q, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
}

export function useAdminUser(id: number) {
  return useQuery({ queryKey: adminKeys.user(id), queryFn: () => adminApi.user(id) });
}

export function useUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => adminApi.setUserStatus(id, isActive),
    onSuccess: (user) => {
      qc.setQueryData(adminKeys.user(user.id), user);
      return Promise.all([qc.invalidateQueries({ queryKey: ['admin', 'users'] }), qc.invalidateQueries({ queryKey: ['admin', 'summary'] })]);
    },
  });
}

export function useAdminSummary() {
  return useQuery({ queryKey: adminKeys.summary, queryFn: adminApi.summary });
}

export function useAdminOrders(q: { status: OrderStatus | 'all' | 'active'; search?: string }) {
  return useInfiniteQuery({
    queryKey: ['admin', 'orders', q],
    queryFn: ({ pageParam }) => adminApi.orders({ ...q, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
}

export function useAdminOrder(id: number) {
  return useQuery({ queryKey: ['admin', 'order', id], queryFn: () => adminApi.order(id), enabled: id > 0 });
}

export function useOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => adminApi.setOrderStatus(id, status),
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['admin'] }), qc.invalidateQueries({ queryKey: ['products'] })]),
  });
}

export function useSalesReport(month: string) {
  return useQuery({ queryKey: ['admin', 'report', month], queryFn: () => adminApi.report(month) });
}
