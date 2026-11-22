import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Emoji } from '@/components/emoji';
import { ErrorView, LoadingView } from '@/components/state-views';
import { useCompanyOverview } from '@/hooks/use-commerce';
import { useI18n, type TranslationKey } from '@/i18n';
import { money } from '@/lib/format';
import { colors, font, radius, shadow } from '@/theme';
import { CompanyHeader } from './company-header';

const ACT_EMOJI: Record<string, string> = {
  order_pending: '🕒',
  order_processing: '🔔',
  order_shipped: '📦',
  order_completed: '✅',
  order_cancelled: '❌',
  invoice_paid: '✅',
};

function compact(n: number, language: 'es' | 'en') {
  if (n >= 1000) return `$${Math.round(n / 1000).toLocaleString(language === 'es' ? 'es-CO' : 'en-US')}k`;
  return money(n, language);
}

/** Pantalla "Mi Empresa" de Figma: crédito, cifras del mes y actividad. */
export function CompanyHomeScreen() {
  const { t, language } = useI18n();
  const query = useCompanyOverview();
  const d = query.data;
  // Momento de referencia para "hace X" (se fija al montar la pantalla).
  const [now] = useState(() => Date.now());

  const ago = (at: string) => {
    const mins = Math.max(0, Math.round((now - new Date(at).getTime()) / 60000));
    if (mins < 60) return t('common.minutesAgo', { count: mins });
    if (mins < 60 * 24) return t('common.hoursAgo', { count: Math.round(mins / 60) });
    const days = Math.round(mins / 1440);
    return days === 1 ? t('common.yesterday') : t('common.daysAgo', { count: days });
  };

  return (
    <View style={styles.flex}>
      <CompanyHeader
        title={t('company.title')}
        subtitle={d ? `${d.company.name} · ${d.company.tier === 'premium' ? t('company.tierPremium') : t('company.tierStandard')}` : undefined}
      />
      {query.isPending ? (
        <LoadingView />
      ) : query.isError || !d ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} colors={[colors.orange]} />}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Emoji char="🏢" size={30} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName}>{d.company.name}</Text>
                <Text style={styles.heroSub}>
                  {t('company.taxId', {
                    id: d.company.taxId,
                    tier: d.company.tier === 'premium' ? t('company.tierPremium') : t('company.tierStandard'),
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.creditRow}>
              <Credit value={compact(d.company.creditLimit, language)} label={t('company.credit')} />
              <Credit value={compact(d.company.creditUsed, language)} label={t('company.used')} />
              <Credit value={compact(d.company.creditAvailable, language)} label={t('company.available')} />
            </View>
          </View>

          <View style={styles.grid}>
            <Stat emoji="📦" value={String(d.stats.ordersThisMonth)} label={t('company.ordersMonth')} onPress={() => router.push('/orders-history')} />
            <Stat emoji="💰" value={compact(d.stats.amountThisMonth, language)} label={t('company.amountMonth')} />
            <Stat emoji="📄" value={String(d.stats.pendingInvoices)} label={t('company.pendingInvoices')} onPress={() => router.navigate('/company/invoices')} />
            <Stat emoji="⭐" value={d.stats.points.toLocaleString(language === 'es' ? 'es-CO' : 'en-US')} label={t('company.points')} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('company.activity')}</Text>
            {d.activity.length === 0 ? <Text style={styles.muted}>{t('company.noActivity')}</Text> : null}
            {d.activity.map((a) => (
              <Pressable
                key={`${a.type}-${a.reference}`}
                style={styles.actRow}
                disabled={!a.orderId}
                onPress={() => a.orderId && router.push({ pathname: '/orders/[id]', params: { id: String(a.orderId) } })}>
                <View style={styles.actIcon}>
                  <Emoji char={ACT_EMOJI[a.type] ?? '•'} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actTitle}>{t(`company.act_${a.type}` as TranslationKey)}</Text>
                  <Text style={styles.muted}>
                    {a.reference} · {money(a.amount, language)}
                  </Text>
                </View>
                <Text style={styles.muted}>{ago(a.at)}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Credit({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.credit}>
      <Text style={styles.creditValue}>{value}</Text>
      <Text style={styles.creditLabel}>{label}</Text>
    </View>
  );
}

function Stat({ emoji, value, label, onPress }: { emoji: string; value: string; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.stat} onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <Emoji char={emoji} size={26} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 14, paddingBottom: 30 },
  hero: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: 18, gap: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroName: { color: colors.white, fontSize: 20, fontWeight: font.heavy },
  heroSub: { color: colors.textOnDarkMuted, fontSize: 13, marginTop: 2 },
  creditRow: { flexDirection: 'row', gap: 8 },
  credit: { flex: 1, backgroundColor: colors.navy800, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  creditValue: { color: colors.white, fontSize: 17, fontWeight: font.heavy },
  creditLabel: { color: colors.textOnDarkMuted, fontSize: 12, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  stat: { width: '48.3%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 6, ...shadow.card },
  statValue: { fontSize: 24, fontWeight: font.heavy, color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 14, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, gap: 14, ...shadow.card },
  cardTitle: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  actTitle: { fontSize: 15, fontWeight: font.semibold, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
});
