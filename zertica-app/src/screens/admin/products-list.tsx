import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { AdminProduct, StatusFilter } from '@/api/types';
import { StatusChips } from '@/components/filter-chips';
import { IconAction } from '@/components/icon-action';
import { ProductImage } from '@/components/product-image';
import { HeaderIconButton, HeaderPill } from '@/components/screen-header';
import { SearchInput } from '@/components/search-input';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { StatusBadge, Tag } from '@/components/status-badge';
import { useAdminProducts, useAdminSummary, useProductStatus } from '@/hooks/use-admin';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n';
import { confirmAction, showMessage } from '@/lib/confirm';
import { money } from '@/lib/format';
import { colors, font, radius, shadow } from '@/theme';
import { AdminHeader } from './admin-header';

/** Pantalla "Productos" del panel (Figma). CU-16 listado, CU-19 desactivar, CU-20 reactivar. */
export function AdminProductsScreen() {
  const { t, language, errorMessage } = useI18n();
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const search = useDebouncedValue(searchText.trim(), 400);
  const query = useAdminProducts({ search: search || undefined, status });
  const summary = useAdminSummary();
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

  const openNew = () => router.push('/admin/products/new');

  return (
    <View style={styles.flex}>
      <AdminHeader
        title={t('admin.products')}
        subtitle={summary.data ? t('adminHome.productsSubtitle', { count: summary.data.products.active }) : undefined}
        actions={
          <>
            <HeaderIconButton emoji="🗂️" label={t('admin.categories')} onPress={() => router.push('/admin/categories')} />
            <HeaderPill label={t('adminHome.newShort')} onPress={openNew} />
          </>
        }
      />
      <View style={styles.controls}>
        <SearchInput value={searchText} onChangeText={setSearchText} placeholder={t('admin.searchProducts')} />
        <StatusChips value={status} onChange={setStatus} />
      </View>

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
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
              onPress={() => router.push({ pathname: '/admin/products/[id]', params: { id: String(item.id) } })}
              accessibilityRole="button"
              accessibilityLabel={item.name}>
              <ProductImage uri={item.imageUrl} categoryName={item.category.name} style={styles.thumb} iconSize={22} />
              <View style={styles.rowBody}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.category.name} · {t('cart.stock', { count: item.stock })}
                </Text>
                <Text style={styles.ref} numberOfLines={1}>
                  {item.reference}
                </Text>
                {!item.category.isActive ? (
                  <View style={{ marginTop: 4 }}>
                    <Tag label={t('admin.inactiveCategoryTag')} tone="warning" />
                  </View>
                ) : null}
              </View>
              <View style={styles.side}>
                <Text style={styles.price}>{money(item.price, language)}</Text>
                <StatusBadge active={item.isActive} />
                <View style={styles.actions}>
                  <IconAction
                    icon="pencil"
                    tone="info"
                    label={t('common.edit')}
                    onPress={() => router.push({ pathname: '/admin/products/[id]', params: { id: String(item.id) } })}
                  />
                  <IconAction
                    icon={item.isActive ? 'eye-off-outline' : 'eye-outline'}
                    tone={item.isActive ? 'danger' : 'success'}
                    label={item.isActive ? t('common.deactivate') : t('common.reactivate')}
                    loading={busyId === item.id}
                    onPress={() => onToggle(item)}
                  />
                </View>
              </View>
            </Pressable>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.orange} style={{ margin: 16 }} /> : undefined}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} colors={[colors.orange]} />}
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  controls: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    ...shadow.card,
  },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  rowBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: font.bold, color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  side: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 17, fontWeight: font.heavy, color: colors.orange },
  ref: { fontSize: 12, color: colors.orangeDark, fontWeight: font.bold, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 6 },
});
