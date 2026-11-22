import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { OrderStatus } from '@/api/types';
import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chip';
import { OrderCard } from '@/components/order-card';
import { HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { useOrders } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

type Filter = OrderStatus | 'all' | 'active';
const FILTERS: Filter[] = ['all', 'active', 'completed', 'cancelled'];

/** Pantalla "Mis Pedidos" (historial de compras) de Figma. */
export function OrdersScreen({ back }: { back?: boolean }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const query = useOrders(filter);
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);

  const label = (f: Filter) => (f === 'all' ? t('orders.all') : f === 'active' ? t('orders.active') : t(`orderStatus.${f}`));

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={t('orders.title')}
        subtitle={t('orders.subtitle')}
        leading={back ? 'none' : 'logo'}
        back={back}
        right={
          <>
            <HeaderIconButton emoji="🔄" label={t('common.retry')} onPress={() => void query.refetch()} />
            {!back ? <Avatar name={user?.fullName ?? '?'} size={40} shape="rounded" /> : null}
          </>
        }
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsWrap} contentContainerStyle={styles.chips}>
        {FILTERS.map((f) => (
          <Chip key={f} label={label(f)} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
      {query.isPending ? (
        <LoadingView />
      ) : query.isError ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyView
              icon="clipboard-text-outline"
              title={t('orders.emptyTitle')}
              body={t('orders.emptyBody')}
              actionLabel={t('cart.goCatalog')}
              onAction={() => router.navigate('/catalog')}
            />
          }
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => router.push({ pathname: '/orders/[id]', params: { id: String(item.id) } })} />
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
  chipsWrap: { flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  list: { padding: 16, gap: 14, flexGrow: 1 },
});
