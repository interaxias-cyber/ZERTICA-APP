import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { adminApi } from '@/api/admin';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { HeaderPill } from '@/components/screen-header';
import { ErrorView, LoadingView } from '@/components/state-views';
import { useSalesReport } from '@/hooks/use-admin';
import { useI18n } from '@/i18n';
import { showMessage } from '@/lib/confirm';
import { shareCsv, shareReportPdf } from '@/lib/documents';
import { currentMonth, money, monthLabel, shiftMonth } from '@/lib/format';
import { colors, font, radius, shadow } from '@/theme';
import { AdminHeader } from './admin-header';

/** Pantalla "Reportes" de Figma: resumen mensual, ventas por categoría y exportación. */
export function ReportsScreen() {
  const { t, language, errorMessage } = useI18n();
  const [month, setMonth] = useState(currentMonth());
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const query = useSalesReport(month);
  const r = query.data;
  const max = Math.max(1, ...(r?.salesByCategory ?? []).map((c) => c.total));
  const isCurrent = month >= currentMonth();

  const labels = {
    title: t('reports.title'),
    totalSales: t('reports.totalSales'),
    orders: t('reports.orders'),
    completed: t('reports.completed'),
    newUsers: t('reports.newUsers'),
    conversion: t('reports.conversion'),
    avgTicket: t('reports.avgTicket'),
    byCategory: t('reports.byCategory'),
  };

  const exportPdf = async () => {
    if (!r) return;
    setExporting('pdf');
    try {
      await shareReportPdf(r, language, labels);
    } catch (err) {
      showMessage(t('reports.exportPdf'), errorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  const exportCsv = async () => {
    setExporting('csv');
    try {
      await shareCsv(await adminApi.reportCsv(month), `zertica-ventas-${month}.csv`);
    } catch (err) {
      showMessage(t('reports.exportExcel'), errorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  return (
    <View style={styles.flex}>
      <AdminHeader title={t('reports.title')} subtitle={monthLabel(month, language)} actions={<HeaderPill plain label={t('reports.export')} onPress={exportPdf} />} />
      <View style={styles.monthBar}>
        <Pressable onPress={() => setMonth(shiftMonth(month, -1))} style={styles.monthBtn} accessibilityRole="button" accessibilityLabel="previous month">
          <Icon name="chevron-left" size={24} color={colors.navy} />
        </Pressable>
        <Text style={styles.monthText}>📅 {monthLabel(month, language)}</Text>
        <Pressable
          onPress={() => setMonth(shiftMonth(month, 1))}
          disabled={isCurrent}
          style={[styles.monthBtn, isCurrent && { opacity: 0.3 }]}
          accessibilityRole="button"
          accessibilityLabel="next month">
          <Icon name="chevron-right" size={24} color={colors.navy} />
        </Pressable>
      </View>
      {query.isPending ? (
        <LoadingView />
      ) : query.isError || !r ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} colors={[colors.orange]} />}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('reports.summary')}</Text>
            <Row label={t('reports.totalSales')} value={money(r.totalSales, language)} />
            <Row label={t('reports.completed')} value={String(r.completedOrders)} />
            <Row label={t('reports.newUsers')} value={String(r.newUsers)} />
            <Row label={t('reports.conversion')} value={`${r.conversionRate}%`} />
            <Row label={t('reports.avgTicket')} value={money(r.averageTicket, language)} last />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('reports.byCategory')}</Text>
            {r.salesByCategory.length === 0 ? <Text style={styles.muted}>{t('reports.noSales')}</Text> : null}
            {r.salesByCategory.map((c) => (
              <View key={c.category} style={{ marginBottom: 12 }}>
                <View style={styles.catRow}>
                  <Text style={styles.catName}>{c.category}</Text>
                  <Text style={styles.catValue}>{money(c.total, language)}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(c.total / max) * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
          <View style={styles.exportRow}>
            <Button title={`📄  ${t('reports.exportPdf')}`} variant="outline" style={styles.exportBtn} loading={exporting === 'pdf'} onPress={exportPdf} />
            <Button title={`📊  ${t('reports.exportExcel')}`} variant="outline" style={styles.exportBtn} loading={exporting === 'csv'} onPress={exportCsv} testID="export-csv" />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  monthBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  monthText: { fontSize: 16, fontWeight: font.bold, color: colors.text },
  body: { padding: 16, gap: 14, paddingBottom: 30 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, ...shadow.card },
  cardTitle: { fontSize: 17, fontWeight: font.bold, color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLabel: { fontSize: 15, color: colors.textBody },
  rowValue: { fontSize: 16, fontWeight: font.heavy, color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, color: colors.textBody },
  catValue: { fontSize: 14, fontWeight: font.bold, color: colors.text },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.chip, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.orange },
  exportRow: { flexDirection: 'row', gap: 12 },
  exportBtn: { flex: 1, backgroundColor: colors.surface, borderColor: colors.surface },
});
