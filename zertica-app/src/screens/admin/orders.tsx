import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { Order, OrderStatus } from '@/api/types';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { OrderCard } from '@/components/order-card';
import { HeaderIconButton } from '@/components/screen-header';
import { SearchInput } from '@/components/search-input';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { useAdminOrders, useAdminSummary, useOrderStatus } from '@/hooks/use-admin';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n';
import { showMessage } from '@/lib/confirm';
import { useToast } from '@/providers/toast-provider';
import { colors } from '@/theme';
import { AdminHeader } from './admin-header';

type Filter = OrderStatus | 'all' | 'active';
const FILTERS: Filter[] = ['active', 'all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'];

/** Pantalla "Pedidos" del panel (Figma): filtrar, ver detalle y actualizar estado. */
export function AdminOrdersScreen() {
  const { t, errorMessage } = useI18n();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('active');
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const search = useDebouncedValue(searchText.trim(), 400);
  const query = useAdminOrders({ status: filter, search: search || undefined });
  const summary = useAdminSummary();
  const update = useOrderStatus();
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);
  const label = (f: Filter) => (f === 'all' ? t('orders.all') : f === 'active' ? t('orders.active') : t(`orderStatus.${f}`));

  const apply = async (o: Order, status: OrderStatus) => {
    try {
      await update.mutateAsync({ id: o.id, status });
      toast(t('adminOrders.updated'));
    } catch (err) {
      showMessage(t('adminOrders.update'), errorMessage(err));
    }
  };

  /** "Actualizar": elige entre las transiciones válidas del pedido. */
  const onUpdate = (o: Order) => {
    if (!o.allowedTransitions.length) {
      showMessage(t('adminOrders.updateTitle', { code: o.code }), t('adminOrders.noTransitions'));
      return;
    }
    if (Platform.OS === 'web') {
      router.push({ pathname: '/admin/orders/[id]', params: { id: String(o.id) } });
      return;
    }
    Alert.alert(t('adminOrders.updateTitle', { code: o.code }), t('adminOrders.updateBody'), [
      ...o.allowedTransitions.map((s) => ({
        text: t(`adminOrders.toStatus_${s}` as 'adminOrders.toStatus_shipped'),
        style: s === 'cancelled' ? ('destructive' as const) : ('default' as const),
        onPress: () => void apply(o, s),
      })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };

  return (
    <View style={styles.flex}>
      <AdminHeader
        title={t('adminOrders.title')}
        subtitle={summary.data ? t('adminOrders.subtitle', { count: summary.data.orders.active }) : undefined}
        actions={<HeaderIconButton emoji="🔍" label={t('common.search')} accent={showSearch} onPress={() => setShowSearch((v) => !v)} />}
      />
      <View style={styles.controls}>
        {showSearch ? <SearchInput value={searchText} onChangeText={setSearchText} placeholder={t('adminOrders.search')} autoFocus /> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <Chip key={f} label={label(f)} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>
      {query.isPending ? (
        <LoadingView />
      ) : query.isError ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyView icon="clipboard-text-outline" title={t('adminOrders.empty')} />}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              showCustomer
              onPress={() => router.push({ pathname: '/admin/orders/[id]', params: { id: String(item.id) } })}
              actions={
                <>
                  <Button title={t('orders.viewDetail').replace(' →', '')} variant="light" size="sm" onPress={() => router.push({ pathname: '/admin/orders/[id]', params: { id: String(item.id) } })} />
                  <Button title={t('adminOrders.update')} size="sm" disabled={!item.allowedTransitions.length} onPress={() => onUpdate(item)} />
                </>
              }
            />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.orange} style={{ margin: 16 }} /> : undefined}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} colors={[colors.orange]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  controls: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  list: { padding: 16, gap: 14, flexGrow: 1 },
});
