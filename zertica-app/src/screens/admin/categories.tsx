import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Icon, categoryIcon } from '@/components/icon';
import { HeaderIconButton, ScreenHeader } from '@/components/screen-header';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { StatusBadge } from '@/components/status-badge';
import { useAdminCategories } from '@/hooks/use-admin';
import { useI18n } from '@/i18n';
import { colors, font, radius, shadow } from '@/theme';

/** Módulo E: listado de categorías (activas y desactivadas). */
export function AdminCategoriesScreen() {
  const { t } = useI18n();
  const query = useAdminCategories();

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={t('admin.categories')}
        subtitle={query.data ? t('common.results', { count: query.data.length }) : undefined}
        back
        right={<HeaderIconButton icon="plus" accent label={t('admin.newCategory')} onPress={() => router.push('/admin/categories/new')} />}
      />
      {query.isPending ? (
        <LoadingView />
      ) : query.isError ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyView icon="shape-outline" title={t('admin.emptyCategories')} />}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} colors={[colors.orange]} />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({ pathname: '/admin/categories/[id]', params: { id: String(item.id) } })}
              accessibilityRole="button">
              <View style={styles.icon}>
                <Icon name={categoryIcon(item.name)} size={22} color={colors.navy} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{(item.productCount === 1 ? t('admin.productsCountOne') : t('admin.productsCount', { count: item.productCount }))}</Text>
              </View>
              <StatusBadge active={item.isActive} />
              <Icon name="chevron-right" size={22} color="#B3BAC7" />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    ...shadow.card,
  },
  icon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.navy100, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: font.bold, color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
});
