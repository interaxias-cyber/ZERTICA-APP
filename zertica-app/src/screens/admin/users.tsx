import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { StatusFilter } from '@/api/types';
import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { SearchInput } from '@/components/search-input';
import { Segmented } from '@/components/segmented';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { StatusBadge, Tag } from '@/components/status-badge';
import { useAdminUsers } from '@/hooks/use-admin';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n';
import { colors, font, radius, shadow } from '@/theme';

/** CU-25 Consultar usuarios. */
export function AdminUsersScreen() {
  const { t } = useI18n();
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const search = useDebouncedValue(searchText.trim(), 400);
  const query = useAdminUsers({ search: search || undefined, status });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={t('admin.users')}
        subtitle={query.data ? t('common.results', { count: query.data.pages[0].meta.total }) : undefined}
        back>
        <View style={styles.controls}>
          <SearchInput value={searchText} onChangeText={setSearchText} placeholder={t('admin.searchUsers')} />
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
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({ pathname: '/admin/users/[id]', params: { id: String(item.id) } })}
              accessibilityRole="button">
              <Avatar name={item.fullName} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.fullName}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  @{item.username} · {item.email}
                </Text>
                <View style={styles.tags}>
                  <StatusBadge active={item.isActive} />
                  {item.role === 'admin' ? <Tag label={t('profile.roleAdmin')} tone="orange" /> : null}
                </View>
              </View>
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
  controls: { gap: 10, marginTop: 12 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    ...shadow.card,
  },
  name: { fontSize: 15, fontWeight: font.bold, color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted },
  tags: { flexDirection: 'row', gap: 6, marginTop: 4 },
});
