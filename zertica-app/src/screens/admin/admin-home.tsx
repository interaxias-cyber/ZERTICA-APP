import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { Emoji } from '@/components/emoji';
import { ErrorView, LoadingView } from '@/components/state-views';
import { useAdminCategories, useAdminSummary } from '@/hooks/use-admin';
import { useI18n } from '@/i18n';
import { colors, font, radius, shadow } from '@/theme';
import { AdminHeader } from './admin-header';

/**
 * Resumen del panel (pantalla "Dashboard" de Figma) con datos del MVP:
 * conteos de productos, usuarios, categorías y marcas. Ventas y pedidos están
 * fuera del alcance, así que no se muestran.
 */
export function AdminHomeScreen() {
  const { t } = useI18n();
  const summary = useAdminSummary();
  const categories = useAdminCategories();
  const s = summary.data;
  const max = Math.max(1, ...(categories.data ?? []).map((c) => c.productCount));

  return (
    <View style={styles.flex}>
      <AdminHeader title={t('adminHome.title')} subtitle={t('adminHome.subtitle')} />
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
            <Stat emoji="📦" value={s.products.active} label={t('adminHome.activeProducts')} note={t('adminHome.ofTotal', { total: s.products.total })} />
            <Stat emoji="👥" value={s.users.active} label={t('adminHome.activeUsers')} note={t('adminHome.ofTotal', { total: s.users.total })} />
            <Stat emoji="🗂️" value={s.categories.active} label={t('adminHome.activeCategories')} note={t('adminHome.ofTotal', { total: s.categories.total })} />
            <Stat emoji="🏷️" value={s.brands.total} label={t('adminHome.brands')} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('adminHome.byCategory')}</Text>
            {(categories.data ?? []).map((c) => (
              <View key={c.id} style={styles.barRow}>
                <View style={styles.barLabels}>
                  <Text style={[styles.barName, !c.isActive && styles.inactive]}>
                    {c.name}
                    {c.isActive ? '' : ` · ${t('common.inactive')}`}
                  </Text>
                  <Text style={styles.barValue}>{c.productCount}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.bar, { width: `${(c.productCount / max) * 100}%` }, !c.isActive && styles.barInactive]} />
                </View>
              </View>
            ))}
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

function Stat({ emoji, value, label, note }: { emoji: string; value: number; label: string; note?: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statTop}>
        <Emoji char={emoji} size={26} />
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 14, paddingBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  stat: { width: '48.3%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow.card },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  note: { fontSize: 12, fontWeight: font.bold, color: colors.success },
  statValue: { fontSize: 28, fontWeight: font.heavy, color: colors.text, marginTop: 10 },
  statLabel: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, ...shadow.card },
  cardTitle: { fontSize: 17, fontWeight: font.bold, color: colors.text, marginBottom: 14 },
  barRow: { marginBottom: 12 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barName: { fontSize: 14, color: colors.textBody },
  inactive: { color: colors.textMuted },
  barValue: { fontSize: 14, fontWeight: font.bold, color: colors.text },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.chip, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.orange },
  barInactive: { backgroundColor: '#D1D5DB' },
});
