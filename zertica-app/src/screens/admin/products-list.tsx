import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { AdminProduct, StatusFilter } from '@/api/types';
import { Button } from '@/components/button';
import { ProductImage } from '@/components/product-image';
import { HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { SearchInput } from '@/components/search-input';
import { Segmented } from '@/components/segmented';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { StatusBadge, Tag } from '@/components/status-badge';
import { useAdminProducts, useProductStatus } from '@/hooks/use-admin';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n';
import { confirmAction, showMessage } from '@/lib/confirm';
import { colors, font, radius, shadow } from '@/theme';

/** CU-16 listado (activos y desactivados), CU-19 desactivar, CU-20 reactivar. */
export function AdminProductsScreen() {
  const { t, errorMessage } = useI18n();
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const search = useDebouncedValue(searchText.trim(), 400);
  const query = useAdminProducts({ search: search || undefined, status });
  const toggle = useProductStatus();
  const [busyId, setBusyId] = useState<number | null>(null);
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);

  const onToggle = async (p: AdminProduct) => {
    const activating = !p.isActive;
    const ok = await confirmAction(
      activating ? t('admin.reactivateProductTitle') : t('admin.deactivateProductTitle'),
      activating ? t('admin.reactivateProductBody', { name: p.name }) : t('admin.deactivateProductBody', { name: p.name }),
      activating ? t('common.reactivate') : t('common.deactivate'),
      t('common.cancel'),
      !activating,
    );
    if (!ok) return;
    setBusyId(p.id);
    try {
      const res = await toggle.mutateAsync({ id: p.id, isActive: activating });
      if (res.warning?.code === 'CATEGORY_INACTIVE') showMessage(t('admin.reactivateProductTitle'), t('admin.categoryInactiveWarning'));
    } catch (err) {
      showMessage(t('admin.products'), errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={t('admin.products')}
        subtitle={query.data ? t('common.results', { count: query.data.pages[0].meta.total }) : undefined}
        back
        right={<HeaderIconButton icon="plus" accent label={t('admin.newProduct')} onPress={() => router.push('/admin/products/new')} />}>
        <View style={styles.controls}>
          <SearchInput value={searchText} onChangeText={setSearchText} placeholder={t('admin.searchProducts')} />
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: t('common.all') },
              { value: 'active', label: t('common.active') },
              { value: 'inactive', label: t('common.inactive') },
            ]}
          />
        </View>
      </ScreenHeader>

      {query.isPending ? (
        <LoadingView />
      ) : query.isError ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyView title={t('admin.emptyProducts')} />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({ pathname: '/admin/products/[id]', params: { id: String(item.id) } })}
              accessibilityRole="button">
              <ProductImage uri={item.imageUrl} categoryName={item.category.name} style={styles.thumb} iconSize={24} />
              <View style={styles.rowBody}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.reference} · {item.brand.name}
                </Text>
                <View style={styles.tags}>
                  <StatusBadge active={item.isActive} />
                  {!item.category.isActive ? <Tag label={t('admin.inactiveCategoryTag')} tone="muted" /> : null}
                </View>
              </View>
              <Button
                title={item.isActive ? t('common.deactivate') : t('common.reactivate')}
                variant={item.isActive ? 'danger' : 'outline'}
                size="sm"
                loading={busyId === item.id}
                onPress={() => onToggle(item)}
              />
            </Pressable>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.orange} style={{ margin: 16 }} /> : undefined}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} colors={[colors.orange]} />
          }
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  controls: { gap: 10, marginTop: 12 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 10,
    ...shadow.card,
  },
  thumb: { width: 60, height: 60, borderRadius: radius.md },
  rowBody: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: font.bold, color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
  tags: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
});
