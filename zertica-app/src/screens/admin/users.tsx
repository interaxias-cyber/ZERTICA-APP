import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { StatusFilter } from '@/api/types';
import { Avatar } from '@/components/avatar';
import { StatusChips } from '@/components/filter-chips';
import { Icon } from '@/components/icon';
import { SearchInput } from '@/components/search-input';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { StatusBadge, Tag } from '@/components/status-badge';
import { useAdminSummary, useAdminUsers } from '@/hooks/use-admin';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n';
import { colors, font, radius, shadow } from '@/theme';
import { AdminHeader } from './admin-header';

/** Pantalla "Usuarios" del panel (Figma). CU-25 Consultar usuarios. */
export function AdminUsersScreen() {
  const { t } = useI18n();
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const search = useDebouncedValue(searchText.trim(), 400);
  const query = useAdminUsers({ search: search || undefined, status });
  const summary = useAdminSummary();
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);

  return (
    <View style={styles.flex}>
      <AdminHeader
        title={t('admin.users')}
        subtitle={summary.data ? t('adminHome.usersSubtitle', { count: summary.data.users.total }) : undefined}
      />
      <View style={styles.controls}>
        <SearchInput value={searchText} onChangeText={setSearchText} placeholder={t('admin.searchUsers')} />
        <StatusChips value={status} onChange={setStatus} />
      </View>
      {query.isPending ? (
        <LoadingView />
      ) : query.isError ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyView icon="account-search-outline" title={t('admin.emptyUsers')} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.orange} style={{ margin: 16 }} /> : undefined}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} colors={[colors.orange]} />}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
              onPress={() => router.push({ pathname: '/admin/users/[id]', params: { id: String(item.id) } })}
              accessibilityRole="button"
              accessibilityLabel={item.fullName}>
              <Avatar name={item.fullName} size={52} tone={item.role === 'admin' ? 'navy' : 'orange'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.fullName}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.email}
                </Text>
                <View style={styles.tags}>
                  <Tag label={item.role === 'admin' ? t('profile.roleAdmin') : t('profile.roleUser')} tone={item.role === 'admin' ? 'info' : 'muted'} />
                  <StatusBadge active={item.isActive} />
                </View>
              </View>
              <Icon name="chevron-right" size={22} color="#9CA3AF" />
            </Pressable>
          )}
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
    padding: 16,
    ...shadow.card,
  },
  name: { fontSize: 16, fontWeight: font.bold, color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 8 },
});
