import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Invoice } from '@/api/types';
import { companyApi } from '@/api/commerce';
import { Button } from '@/components/button';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Tag } from '@/components/status-badge';
import { useInvoices, usePayInvoice } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { confirmAction, showMessage } from '@/lib/confirm';
import { shareInvoicePdf } from '@/lib/documents';
import { money, shortDate } from '@/lib/format';
import { invoiceTone } from '@/lib/status';
import { useToast } from '@/providers/toast-provider';
import { colors, font, radius, shadow } from '@/theme';
import { CompanyHeader } from './company-header';

/** Pantalla "Facturación" de Figma: PDF y pago (simulado) de facturas. */
export function InvoicesScreen() {
  const { t, language, errorMessage } = useI18n();
  const toast = useToast();
  const query = useInvoices();
  const pay = usePayInvoice();
  const [busy, setBusy] = useState<number | null>(null);
  const unpaid = query.data?.meta.unpaidCount ?? 0;

  const onPay = async (inv: Invoice) => {
    const ok = await confirmAction(
      t('company.payTitle'),
      t('company.payBody', { code: inv.code, amount: money(inv.amount, language) }),
      t('company.payNow'),
      t('common.cancel'),
    );
    if (!ok) return;
    setBusy(inv.id);
    try {
      await pay.mutateAsync(inv.id);
      toast(t('company.paid'));
    } catch (err) {
      showMessage(t('company.payTitle'), errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const onPdf = async (inv: Invoice) => {
    setBusy(-inv.id);
    try {
      const detail = await companyApi.invoice(inv.id);
      await shareInvoicePdf(detail, language, {
        issued: t('company.issued', { date: shortDate(detail.issuedAt, language) }),
        due: t('company.due', { date: shortDate(detail.dueAt, language) }),
        status: t(`invoiceStatus.${detail.status}`),
        taxId: t('company.taxIdLabel'),
        order: t('orders.title'),
        product: t('orders.items'),
        qty: t('cart.quantity'),
        price: 'P/U',
        amount: t('cart.total'),
        subtotal: t('cart.subtotal'),
        discount: t('company.volumeDiscounts'),
        total: t('cart.total'),
        footer: 'Zertica · Drywall Shop',
      });
    } catch (err) {
      showMessage(t('company.viewPdf'), errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.flex}>
      <CompanyHeader
        title={t('company.invoicesTitle')}
        subtitle={t('company.invoicesSubtitle', { count: unpaid })}
        actions={unpaid ? <Tag tone="danger" label={t('company.pendingBadge', { count: unpaid })} /> : undefined}
      />
      {query.isPending ? (
        <LoadingView />
      ) : query.isError ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={query.data.data}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} colors={[colors.orange]} />}
          ListEmptyComponent={<EmptyView icon="file-document-outline" title={t('company.noInvoices')} />}
          renderItem={({ item }) => {
            const payable = item.status === 'pending' || item.status === 'overdue';
            return (
              <View style={styles.card}>
                <View style={styles.top}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.code}>{item.code}</Text>
                    <Text style={styles.muted}>
                      {shortDate(item.issuedAt, language)} · {item.orderCode}
                    </Text>
                    {payable ? <Text style={[styles.muted, item.status === 'overdue' && { color: colors.danger }]}>{t('company.due', { date: shortDate(item.dueAt, language) })}</Text> : null}
                  </View>
                  <Tag tone={invoiceTone[item.status]} label={t(`invoiceStatus.${item.status}`)} />
                </View>
                <Text style={styles.amount}>{money(item.amount, language)}</Text>
                <View style={styles.actions}>
                  <Button title={t('company.viewPdf')} variant="secondary" size="sm" style={{ flex: 1 }} loading={busy === -item.id} onPress={() => onPdf(item)} />
                  {payable ? (
                    <Button title={t('company.payNow')} size="sm" style={{ flex: 1 }} loading={busy === item.id} onPress={() => onPay(item)} testID={`pay-${item.code}`} />
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 14, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, gap: 10, ...shadow.card },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  code: { fontSize: 17, fontWeight: font.heavy, color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 26, fontWeight: font.heavy, color: colors.orange },
  actions: { flexDirection: 'row', gap: 10 },
});
