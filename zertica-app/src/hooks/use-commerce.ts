import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addressesApi, cartApi, companyApi, ordersApi, paymentsApi, type AddressInput, type CardInput, type CheckoutInput } from '@/api/commerce';
import type { Cart, OrderStatus } from '@/api/types';

export const commerceKeys = {
  cart: ['cart'] as const,
  orders: (status: string) => ['orders', status] as const,
  order: (id: number) => ['order', id] as const,
  addresses: ['addresses'] as const,
  payments: ['payments'] as const,
  company: ['company'] as const,
  invoices: ['company', 'invoices'] as const,
  contacts: ['company', 'contacts'] as const,
  companyUsers: ['company', 'users'] as const,
};

export function useCart(enabled = true) {
  return useQuery({ queryKey: commerceKeys.cart, queryFn: cartApi.get, enabled, staleTime: 10_000 });
}

/** Mutaciones del carrito: la respuesta ya trae el carrito actualizado. */
export function useCartMutations() {
  const qc = useQueryClient();
  const setCart = (cart: Cart) => qc.setQueryData(commerceKeys.cart, cart);
  return {
    add: useMutation({
      mutationFn: ({ productId, quantity }: { productId: number; quantity?: number }) => cartApi.add(productId, quantity),
      onSuccess: setCart,
    }),
    setQuantity: useMutation({
      mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) => cartApi.setQuantity(productId, quantity),
      onSuccess: setCart,
    }),
    remove: useMutation({ mutationFn: (productId: number) => cartApi.remove(productId), onSuccess: setCart }),
  };
}

export function useOrders(status: OrderStatus | 'all' | 'active' = 'all') {
  return useInfiniteQuery({
    queryKey: commerceKeys.orders(status),
    queryFn: ({ pageParam }) => ordersApi.list({ status, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
}

export function useOrder(id: number) {
  return useQuery({ queryKey: commerceKeys.order(id), queryFn: () => ordersApi.get(id), enabled: id > 0 });
}

function useInvalidateCommerce() {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      [['cart'], ['orders'], ['order'], ['company'], ['products'], ['product'], ['admin']].map((queryKey) =>
        qc.invalidateQueries({ queryKey }),
      ),
    );
}

export function useCheckout() {
  const invalidate = useInvalidateCommerce();
  return useMutation({ mutationFn: (input: CheckoutInput) => ordersApi.checkout(input), onSuccess: invalidate });
}

export function useCancelOrder() {
  const invalidate = useInvalidateCommerce();
  return useMutation({ mutationFn: (id: number) => ordersApi.cancel(id), onSuccess: invalidate });
}

export function useAddresses() {
  return useQuery({ queryKey: commerceKeys.addresses, queryFn: addressesApi.list });
}

export function useAddressMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: commerceKeys.addresses });
  return {
    save: useMutation({
      mutationFn: ({ id, input }: { id: number | null; input: AddressInput }) =>
        id ? addressesApi.update(id, input) : addressesApi.create(input),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: number) => addressesApi.remove(id), onSuccess: refresh }),
  };
}

export function usePaymentMethods() {
  return useQuery({ queryKey: commerceKeys.payments, queryFn: paymentsApi.list });
}

export function usePaymentMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: commerceKeys.payments });
  return {
    add: useMutation({ mutationFn: (input: CardInput) => paymentsApi.create(input), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: number) => paymentsApi.remove(id), onSuccess: refresh }),
  };
}

export function useCompanyOverview() {
  return useQuery({ queryKey: commerceKeys.company, queryFn: companyApi.overview });
}

export function useInvoices() {
  return useQuery({ queryKey: commerceKeys.invoices, queryFn: () => companyApi.invoices('all') });
}

export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => companyApi.pay(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['company'] }) });
}

export function useContacts() {
  return useQuery({ queryKey: commerceKeys.contacts, queryFn: companyApi.contacts, staleTime: 10 * 60_000 });
}

export function useCompanyUsers() {
  return useQuery({ queryKey: commerceKeys.companyUsers, queryFn: companyApi.users });
}

export function useOrderStats(enabled = true) {
  return useQuery({ queryKey: ['orders', 'stats'], queryFn: ordersApi.stats, enabled });
}
