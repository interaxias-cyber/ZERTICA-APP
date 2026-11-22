import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Emoji } from '@/components/emoji';
import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { StatusBadge } from '@/components/status-badge';
import { useAddresses, useCompanyOverview, useCompanyUsers, usePaymentMethods } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { confirmAction } from '@/lib/confirm';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius, shadow } from '@/theme';
import { CompanyHeader } from './company-header';

/** Pantalla "Mi Cuenta" (configuración empresarial) de Figma. */
export function CompanyAccountScreen() {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const overview = useCompanyOverview();
  const users = useCompanyUsers();
  const addresses = useAddresses();
  const payments = usePaymentMethods();
  const [signingOut, setSigningOut] = useState(false);
  const c = overview.data?.company;

  const logout = async () => {
    const ok = await confirmAction(t('profile.logoutTitle'), t('profile.logoutConfirm'), t('common.yes'), t('common.no'), true);
    if (!ok) return;
    setSigningOut(true);
    await signOut();
  };

  return (
    <View style={styles.flex}>
      <CompanyHeader title={t('company.accountTitle')} subtitle={t('company.accountSubtitle')} />
      {overview.isPending ? (
        <LoadingView />
      ) : overview.isError || !c ? (
        <ErrorView error={overview.error} onRetry={() => overview.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('company.companyData')}</Text>
            <Row label={t('company.legalName')} value={c.legalName} />
            <Row label={t('company.taxIdLabel')} value={c.taxId} />
            <Row label={t('company.regime')} value={c.taxRegime} />
            <Row label={t('company.fiscalAddress')} value={c.fiscalAddress} />
            <Row label={t('company.phone')} value={c.phone} />
            <Row label={t('company.email')} value={c.email} last />
          </View>
          <Item emoji="👥" title={t('company.accountUsers')} count={users.data?.length} onPress={() => router.push('/company/users')} />
          <Item emoji="📍" title={t('company.deliveryAddresses')} count={addresses.data?.length} onPress={() => router.push('/addresses')} />
          <Item emoji="💳" title={t('profileMenu.payments')} count={payments.data?.length} onPress={() => router.push('/payment-methods')} />
          <Item emoji="📋" title={t('company.orderHistory')} onPress={() => router.push('/orders-history')} />
          <Item emoji="🔒" title={t('company.security')} onPress={() => router.push('/change-password')} />
          <Item emoji="🌐" title={t('profile.language')} onPress={() => router.push('/language-settings')} />
          <Item emoji="❓" title={t('company.support')} onPress={() => router.push('/help')} />
          <Item emoji="📜" title={t('profileMenu.terms')} onPress={() => router.push('/terms')} />
          <Button title={signingOut ? t('common.loading') : t('profile.logout')} variant="dangerSolid" onPress={logout} disabled={signingOut} testID="company-logout" />
        </ScrollView>
      )}
    </View>
  );
}

/** "Usuarios de la cuenta". */
export function CompanyUsersScreen() {
  const { t } = useI18n();
  const query = useCompanyUsers();
  return (
    <View style={styles.flex}>
      <ScreenHeader title={t('company.accountUsers')} back />
      {query.isPending ? (
        <LoadingView />
      ) : query.isError ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {query.data.length === 0 ? <EmptyView icon="account-group-outline" title={t('admin.emptyUsers')} /> : null}
          {query.data.map((u) => (
            <View key={u.id} style={styles.userRow}>
              <Avatar name={u.fullName} size={48} tone="navy" />
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{u.fullName}</Text>
                <Text style={styles.muted}>
                  @{u.username} · {u.email}
                </Text>
              </View>
              <StatusBadge active={u.isActive} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Item({ emoji, title, count, onPress }: { emoji: string; title: string; count?: number; onPress: () => void }) {
  return (
    <Pressable style={styles.item} onPress={onPress} accessibilityRole="button">
      <Emoji char={emoji} size={22} />
      <Text style={styles.itemTitle}>{title}</Text>
      {count !== undefined ? (
        <View style={styles.count}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : null}
      <Icon name="chevron-right" size={22} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 12, paddingBottom: 30 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, ...shadow.card },
  cardTitle: { fontSize: 17, fontWeight: font.bold, color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowValue: { fontSize: 14, fontWeight: font.semibold, color: colors.text, flexShrink: 1, textAlign: 'right' },
  muted: { fontSize: 14, color: colors.textMuted },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, ...shadow.card },
  itemTitle: { flex: 1, fontSize: 16, fontWeight: font.bold, color: colors.text },
  count: { backgroundColor: colors.chip, borderRadius: radius.pill, minWidth: 28, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  countText: { fontSize: 13, fontWeight: font.bold, color: colors.text },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, ...shadow.card },
  userName: { fontSize: 16, fontWeight: font.bold, color: colors.text },
});
