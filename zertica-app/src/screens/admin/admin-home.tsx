import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Emoji } from '@/components/emoji';
import { ErrorView, LoadingView } from '@/components/state-views';
import { Tag } from '@/components/status-badge';
import { useAdminCategories, useAdminSummary } from '@/hooks/use-admin';
import { useI18n } from '@/i18n';
import { money, shortDate } from '@/lib/format';
import { orderTone } from '@/lib/status';
import { colors, font, radius, shadow } from '@/theme';
import { AdminHeader } from './admin-header';

/** Pantalla "Dashboard" de Figma: ventas de hoy, pedidos activos, semana, últimos pedidos y top productos. */
export function AdminHomeScreen() {
  const { t, language } = useI18n();
  const summary = useAdminSummary();
  const categories = useAdminCategories();
  const s = summary.data;
  const days = t('dashboard.days').split(',');
  const weekMax = Math.max(1, ...(s?.weekSales ?? []).map((d) => d.total));
  const catMax = Math.max(1, ...(categories.data ?? []).map((c) => c.productCount));

  return (
    <View style={styles.flex}>
      <AdminHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      {summary.isPending ? (
        <LoadingView />
      ) : summary.isError || !s ? (
        <ErrorView error={summary.error} onRetry={() => summary.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={
            <RefreshControl
              refreshing={summary.isRefetching}
              onRefresh={() => {
                summary.refetch();
                categories.refetch();
              }}
              colors={[colors.orange]}
            />
          }>
          <View style={styles.grid}>
            <Stat
              emoji="💰"
              value={money(s.sales.today, language)}
              label={t('dashboard.salesToday')}
              note={s.sales.changePercent !== null ? `${s.sales.changePercent >= 0 ? '+' : ''}${s.sales.changePercent}%` : undefined}
              negative={(s.sales.changePercent ?? 0) < 0}
            />
            <Stat emoji="📦" value={String(s.orders.active)} label={t('dashboard.activeOrders')} note={s.sales.ordersToday ? `+${s.sales.ordersToday}` : undefined} onPress={() => router.navigate('/admin/orders')} />
            <Stat emoji="👥" value={String(s.users.total)} label={t('dashboard.users')} onPress={() => router.navigate('/admin/users')} />
            <Stat emoji="🗃️" value={String(s.products.total)} label={t('dashboard.products')} onPress={() => router.navigate('/admin/products')} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('dashboard.weekSales')}</Text>
            <View style={styles.chart}>
              {s.weekSales.map((d, i) => {
                const isToday = i === s.weekSales.length - 1;
                return (
                  <View key={d.day} style={styles.barCol} accessibilityLabel={`${days[d.weekday]} ${money(d.total, language)}`}>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: `${Math.max(6, (d.total / weekMax) * 100)}%` }, isToday && styles.barToday]} />
                    </View>
                    <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{days[d.weekday]}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('dashboard.latestOrders')}</Text>
            {s.latestOrders.map((o) => (
              <Pressable key={o.id} style={styles.orderRow} onPress={() => router.push({ pathname: '/admin/orders/[id]', params: { id: String(o.id) } })}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderCode}>
                    #{o.code} · {o.customer}
                  </Text>
                  <Text style={styles.muted}>{shortDate(o.createdAt, language, false)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.orderTotal}>{money(o.total, language)}</Text>
                  <Tag tone={orderTone[o.status]} label={t(`orderStatus.${o.status}`)} />
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('dashboard.topProducts')}</Text>
            {s.topProducts.map((p, i) => (
              <View key={p.productId} style={styles.topRow}>
                <Text style={styles.rank}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderCode} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.muted}>{t('dashboard.unitsSold', { count: p.units })}</Text>
                </View>
                <Text style={styles.orderTotal}>{money(p.total, language)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('adminHome.byCategory')}</Text>
            {(categories.data ?? []).map((c) => (
              <View key={c.id} style={{ marginBottom: 10 }}>
                <View style={styles.catLabels}>
                  <Text style={[styles.catName, !c.isActive && styles.muted]}>
                    {c.name}
                    {c.isActive ? '' : ` · ${t('common.inactive')}`}
                  </Text>
                  <Text style={styles.catValue}>{c.productCount}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(c.productCount / catMax) * 100}%` }, !c.isActive && { backgroundColor: '#D1D5DB' }]} />
                </View>
              </View>
            ))}
            <Button title={t('dashboard.manageCategories')} variant="light" onPress={() => router.push('/admin/categories')} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('adminHome.quickActions')}</Text>
            <View style={{ gap: 10 }}>
              <Button title={`+ ${t('admin.newProduct')}`} onPress={() => router.push('/admin/products/new')} />
              <Button title={`+ ${t('admin.newCategory')}`} variant="light" onPress={() => router.push('/admin/categories/new')} />
              <Button title={`📦  ${t('adminHome.viewCatalog')}`} variant="secondary" onPress={() => router.navigate('/catalog')} />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ emoji, value, label, note, negative, onPress }: { emoji: string; value: string; label: string; note?: string; negative?: boolean; onPress?: () => void }) {
  return (
    <Pressable style={styles.stat} onPress={onPress} disabled={!onPress}>
      <View style={styles.statTop}>
        <Emoji char={emoji} size={26} />
        {note ? <Text style={[styles.note, negative && { color: colors.danger }]}>{note}</Text> : null}
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 14, paddingBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  stat: { width: '48.3%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow.card },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  note: { fontSize: 13, fontWeight: font.bold, color: colors.success },
  statValue: { fontSize: 26, fontWeight: font.heavy, color: colors.text, marginTop: 10 },
  statLabel: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, gap: 12, ...shadow.card },
  cardTitle: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  chart: { flexDirection: 'row', height: 130, gap: 8, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: colors.chip, borderRadius: 6 },
  barToday: { backgroundColor: colors.orange },
  barLabel: { fontSize: 12, color: colors.textMuted },
  barLabelToday: { color: colors.orange, fontWeight: font.bold },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderCode: { fontSize: 14, fontWeight: font.bold, color: colors.text },
  orderTotal: { fontSize: 15, fontWeight: font.heavy, color: colors.orange },
  muted: { fontSize: 13, color: colors.textMuted },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.orange100, color: colors.orange, textAlign: 'center', lineHeight: 26, fontWeight: font.heavy, overflow: 'hidden' },
  catLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, color: colors.textBody },
  catValue: { fontSize: 14, fontWeight: font.bold, color: colors.text },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.chip, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.orange },
});
