import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { ProductImage } from '@/components/product-image';
import { QuantityBox } from '@/components/quantity-stepper';
import { ErrorView, LoadingView } from '@/components/state-views';
import { Tag } from '@/components/status-badge';
import { useProducts } from '@/hooks/use-catalog';
import { useI18n } from '@/i18n';
import { bulkDraft, draftTotals, useBulkDraft, VOLUME_TIERS } from '@/lib/bulk-draft';
import { money } from '@/lib/format';
import { colors, font, radius, shadow } from '@/theme';
import { CompanyHeader } from './company-header';

/** Pantalla "Pedido Masivo" de Figma: cantidades por producto con descuentos por volumen. */
export function BulkOrderScreen() {
  const { t, language } = useI18n();
  const products = useProducts({});
  const draft = useBulkDraft();
  const items = useMemo(() => products.data?.pages.flatMap((p) => p.data) ?? [], [products.data]);
  const totals = draftTotals(draft);
  const next = [...VOLUME_TIERS].reverse().find((tier) => totals.units < tier.minQuantity);

  return (
    <View style={styles.flex}>
      <CompanyHeader
        title={t('company.bulkTitle')}
        subtitle={t('company.bulkSubtitle')}
        actions={<Tag tone="warning" label={t('company.volBadge')} />}
      />
      {products.isPending ? (
        <LoadingView />
      ) : products.isError ? (
        <ErrorView error={products.error} onRetry={() => products.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.tiersCard}>
              <Text style={styles.tiersTitle}>{t('company.volumeDiscounts')}</Text>
              <View style={styles.tiers}>
                {[...VOLUME_TIERS].reverse().map((tier) => (
                  <View key={tier.minQuantity} style={[styles.tier, totals.discountPercent === tier.percent && styles.tierOn]}>
                    <Text style={styles.tierText}>{t('company.tier', { min: tier.minQuantity, percent: tier.percent })}</Text>
                  </View>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <ProductImage uri={item.imageUrl} categoryName={item.category.name} style={styles.thumb} iconSize={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>
                  {money(item.price, language)}
                  {t('cart.perUnit')} · {t('cart.stock', { count: item.stock })}
                </Text>
              </View>
              <QuantityBox
                value={draft[item.id]?.quantity ?? 0}
                max={item.stock}
                label={`${t('cart.quantity')} ${item.name}`}
                onChange={(q) => bulkDraft.set(item.id, { quantity: q, price: item.price, name: item.name })}
              />
              <Text style={styles.unit}>{t('common.units')}</Text>
            </View>
          )}
          ListFooterComponent={products.isFetchingNextPage ? <ActivityIndicator color={colors.orange} /> : undefined}
          onEndReached={() => products.hasNextPage && !products.isFetchingNextPage && products.fetchNextPage()}
        />
      )}
      <View style={styles.bar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barUnits}>
            {t('company.units', { count: totals.units })}
            {totals.discountPercent ? ` · -${totals.discountPercent} %` : ''}
          </Text>
          <Text style={styles.barTotal}>{money(totals.total, language)}</Text>
          {next && totals.units > 0 ? (
            <Text style={styles.barHint}>{t('company.nextTier', { count: next.minQuantity - totals.units, percent: next.percent })}</Text>
          ) : null}
        </View>
        <Button
          title={t('company.placeBulk')}
          disabled={totals.units === 0}
          onPress={() => router.push({ pathname: '/checkout', params: { source: 'bulk' } })}
          style={{ paddingHorizontal: 20 }}
          testID="bulk-submit"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  tiersCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 10, marginBottom: 2, ...shadow.card },
  tiersTitle: { fontSize: 16, fontWeight: font.bold, color: colors.text },
  tiers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tier: { backgroundColor: colors.warningBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: colors.warningBg },
  tierOn: { borderColor: colors.orange },
  tierText: { color: colors.warning, fontWeight: font.semibold, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, ...shadow.card },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  name: { fontSize: 15, fontWeight: font.bold, color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  unit: { fontSize: 14, color: colors.textMuted },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.card,
  },
  barUnits: { fontSize: 13, color: colors.textMuted },
  barTotal: { fontSize: 22, fontWeight: font.heavy, color: colors.orange },
  barHint: { fontSize: 12, color: colors.success, fontWeight: font.semibold },
});
