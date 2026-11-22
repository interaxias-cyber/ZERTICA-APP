import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/chip';
import { ProductCard } from '@/components/product-card';
import { HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { SearchInput } from '@/components/search-input';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useBrands, useCategories, useProducts } from '@/hooks/use-catalog';
import { Avatar } from '@/components/avatar';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';
import { colors, font } from '@/theme';

interface Props {
  mode: 'catalog' | 'search' | 'category';
  /** Para "productos por categoría" (CU-13). */
  fixedCategory?: { id: number; name: string };
  initialCategoryId?: number | null;
}

/**
 * Listado del catálogo reutilizado por Catálogo, Búsqueda y Categoría.
 * Consume GET /api/products con search, category_id, brand_id, page y limit.
 */
export function ProductBrowser({ mode, fixedCategory, initialCategoryId = null }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(fixedCategory?.id ?? initialCategoryId);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(mode === 'search');
  const search = useDebouncedValue(searchText.trim(), 400);

  const categories = useCategories();
  const brands = useBrands();

  const searchReady = mode !== 'search' || search.length >= 2 || categoryId !== null || brandId !== null;
  const products = useProducts({ search: search || undefined, categoryId, brandId }, searchReady);

  const items = useMemo(() => products.data?.pages.flatMap((p) => p.data) ?? [], [products.data]);
  const total = products.data?.pages[0]?.meta.total ?? 0;
  const hasFilters = brandId !== null || (!fixedCategory && categoryId !== null);

  const clearAll = () => {
    setSearchText('');
    setBrandId(null);
    if (!fixedCategory) setCategoryId(null);
  };

  const title =
    mode === 'search' ? t('search.title') : fixedCategory ? fixedCategory.name : t('catalog.title');
  const subtitle = mode === 'catalog' ? t('catalog.subtitle') : undefined;

  const header = (
    <ScreenHeader
      title={title}
      subtitle={subtitle}
      back={mode !== 'catalog'}
      leading="logo"
      right={
        <>
          {mode === 'catalog' ? (
            <HeaderIconButton emoji="🔍" label={t('common.search')} onPress={() => router.push('/search')} />
          ) : null}
          <HeaderIconButton
            icon="tune-variant"
            label={t('catalog.filters')}
            accent={showFilters || brandId !== null}
            onPress={() => setShowFilters((v) => !v)}
          />
          {mode === 'catalog' ? (
            <View accessibilityLabel={user?.fullName}>
              <Avatar name={user?.fullName ?? '?'} size={40} shape="rounded" />
            </View>
          ) : null}
        </>
      }>
      {mode !== 'catalog' ? (
        <View style={styles.searchWrap}>
          <SearchInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t('search.placeholder')}
            autoFocus={mode === 'search'}
            testID="search-input"
          />
        </View>
      ) : null}
    </ScreenHeader>
  );

  const filterBar = (
    <View style={styles.filters}>
      {!fixedCategory ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          <Chip label={t('common.all')} selected={categoryId === null} onPress={() => setCategoryId(null)} />
          {(categories.data ?? []).map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={categoryId === c.id}
              onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
            />
          ))}
        </ScrollView>
      ) : null}
      {showFilters ? (
        <View>
          <Text style={styles.filterLabel}>{t('catalog.filterByBrand')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Chip label={t('catalog.allBrands')} selected={brandId === null} onPress={() => setBrandId(null)} />
            {(brands.data ?? []).map((b) => (
              <Chip
                key={b.id}
                label={b.name}
                selected={brandId === b.id}
                onPress={() => setBrandId(brandId === b.id ? null : b.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
      {searchReady && products.data ? (
        <View style={styles.countRow}>
          <Text style={styles.count}>{total === 1 ? t('common.result') : t('common.results', { count: total })}</Text>
          {hasFilters || searchText ? (
            <Text style={styles.clear} onPress={clearAll} accessibilityRole="button">
              {t('catalog.clearFilters')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  let body: React.ReactNode;
  if (!searchReady) {
    body = <EmptyView icon="text-search" title={t('search.hintTitle')} body={t('search.hintBody')} />;
  } else if (products.isPending) {
    body = <LoadingView />;
  } else if (products.isError && items.length === 0) {
    body = <ErrorView error={products.error} onRetry={() => products.refetch()} />;
  }

  const emptyComponent = search ? (
    <EmptyView
      icon="magnify-close"
      title={t('catalog.noResultsTitle')}
      body={t('catalog.noResultsBody', { query: search })}
      actionLabel={mode === 'search' ? t('catalog.backToCatalog') : t('catalog.clearFilters')}
      onAction={mode === 'search' ? () => router.navigate('/catalog') : clearAll}
    />
  ) : (
    <EmptyView
      title={t('catalog.emptyTitle')}
      body={fixedCategory ? t('catalog.categoryEmpty') : t('catalog.emptyBody')}
      actionLabel={hasFilters ? t('catalog.clearFilters') : undefined}
      onAction={hasFilters ? clearAll : undefined}
    />
  );

  return (
    <View style={styles.flex}>
      {header}
      {body ? (
        <View style={styles.flex}>
          {filterBar}
          {body}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          ListHeaderComponent={filterBar}
          ListEmptyComponent={emptyComponent}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <ProductCard product={item} />
            </View>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (products.hasNextPage && !products.isFetchingNextPage) products.fetchNextPage();
          }}
          ListFooterComponent={
            products.isFetchingNextPage ? (
              <ActivityIndicator color={colors.orange} style={{ marginVertical: 18 }} />
            ) : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={products.isRefetching && !products.isFetchingNextPage}
              onRefresh={() => void products.refetch()}
              colors={[colors.orange]}
              tintColor={colors.orange}
            />
          }
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  searchWrap: { marginTop: 12 },
  filters: { paddingTop: 14, gap: 10 },
  chipsRow: { gap: 8, paddingHorizontal: 16 },
  filterLabel: { fontSize: 12, fontWeight: font.bold, color: colors.textMuted, marginLeft: 16, marginBottom: 8 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 4 },
  count: { fontSize: 13, color: colors.textMuted, fontWeight: font.semibold },
  clear: { fontSize: 13, color: colors.orange, fontWeight: font.bold },
  list: { paddingBottom: 28, flexGrow: 1 },
  column: { gap: 12, paddingHorizontal: 16 },
  cell: { flex: 1 / 2, marginTop: 12 },
});
