import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PaymentType } from '@/api/types';
import { ApiError } from '@/api/client';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { ScreenHeader } from '@/components/screen-header';
import { SelectCard } from '@/components/select-card';
import { LoadingView } from '@/components/state-views';
import { TextField } from '@/components/text-field';
import { useAddresses, useCart, useCheckout, useCompanyOverview, usePaymentMethods } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { bulkDraft, draftTotals, useBulkDraft } from '@/lib/bulk-draft';
import { showMessage } from '@/lib/confirm';
import { money } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius } from '@/theme';

/**
 * Finalizar compra: dirección, método de pago y confirmación.
 * source=cart (carrito) o source=bulk (pedido masivo de empresa).
 * El pago con tarjeta es simulado: no hay pasarela de pago real.
 */
export function CheckoutScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const bulk = source === 'bulk';
  const { t, language, errorMessage } = useI18n();
  const { user } = useAuth();
  const isCompany = user?.role === 'company';
  const cart = useCart(!bulk);
  const draft = useBulkDraft();
  const addresses = useAddresses();
  const payments = usePaymentMethods();
  const company = useCompanyOverview();
  const checkout = useCheckout();

  const [addressId, setAddressId] = useState<number | null>(null);
  const [payment, setPayment] = useState<{ type: PaymentType; id?: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const defaultAddress = addresses.data?.find((a) => a.isDefault)?.id ?? addresses.data?.[0]?.id ?? null;
  const selectedAddress = addressId ?? defaultAddress;
  const firstValidCard = payments.data?.find((p) => !p.isExpired);
  const selectedPayment =
    payment ?? (isCompany ? { type: 'credit' as const } : firstValidCard ? { type: 'card' as const, id: firstValidCard.id } : null);

  const totals = bulk
    ? draftTotals(draft)
    : cart.data
      ? { units: cart.data.itemCount, subtotal: cart.data.subtotal, discountPercent: cart.data.discountPercent, discount: cart.data.discount, total: cart.data.total }
      : null;

  if (addresses.isPending || payments.isPending || (!bulk && cart.isPending) || !totals) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title={t('checkout.title')} back />
        <LoadingView />
      </View>
    );
  }

  const submit = async () => {
    setError(null);
    if (!selectedAddress) return setError(t('checkout.selectAddress'));
    if (!selectedPayment) return setError(t('checkout.selectPayment'));
    try {
      const order = await checkout.mutateAsync({
        addressId: selectedAddress,
        paymentType: selectedPayment.type,
        paymentMethodId: selectedPayment.id,
        notes: notes.trim() || undefined,
        items: bulk ? bulkDraft.items() : undefined,
      });
      if (bulk) bulkDraft.clear();
      showMessage(t('checkout.success'), t('checkout.successBody', { code: order.code }));
      router.dismissAll();
      router.push({ pathname: '/orders/[id]', params: { id: String(order.id) } });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INSUFFICIENT_STOCK' && Array.isArray(err.details)) {
        const names = (err.details as { name?: string; available?: number }[]).map((d) => `${d.name ?? ''} (${d.available ?? 0})`).join(', ');
        setError(`${errorMessage(err)} ${names}`);
      } else setError(errorMessage(err));
    }
  };

  const creditAvailable = company.data?.company.creditAvailable ?? 0;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={t('checkout.title')} subtitle={t('cart.items', { count: totals.units })} back />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>{t('checkout.address')}</Text>
        {addresses.data?.length ? (
          addresses.data.map((a) => (
            <SelectCard
              key={a.id}
              emoji="📍"
              title={a.label}
              subtitle={`${a.line1}, ${a.city}${a.postalCode ? ` ${a.postalCode}` : ''}`}
              selected={selectedAddress === a.id}
              onPress={() => setAddressId(a.id)}
            />
          ))
        ) : (
          <Notice tone="info" message={t('checkout.noAddress')} />
        )}
        <Button title={t('checkout.addAddress')} variant="ghost" size="sm" onPress={() => router.push('/addresses/new')} />

        <Text style={styles.section}>{t('checkout.payment')}</Text>
        {isCompany ? (
          <SelectCard
            emoji="🏦"
            title={t('checkout.credit')}
            subtitle={t('checkout.creditSub', { amount: money(creditAvailable, language) })}
            selected={selectedPayment?.type === 'credit'}
            onPress={() => setPayment({ type: 'credit' })}
            testID="pay-credit"
          />
        ) : null}
        {payments.data?.map((p) => (
          <SelectCard
            key={p.id}
            emoji="💳"
            title={`${p.brandName} •••• ${p.last4}`}
            subtitle={p.isExpired ? t('checkout.cardExpired') : t('payments.expires', { date: `${String(p.expMonth).padStart(2, '0')}/${String(p.expYear).slice(-2)}` })}
            selected={selectedPayment?.type === 'card' && selectedPayment.id === p.id}
            disabled={p.isExpired}
            onPress={() => setPayment({ type: 'card', id: p.id })}
          />
        ))}
        <SelectCard
          emoji="💰"
          title={t('checkout.transfer')}
          subtitle={t('checkout.transferSub')}
          selected={selectedPayment?.type === 'transfer'}
          onPress={() => setPayment({ type: 'transfer' })}
          testID="pay-transfer"
        />
        <Button title={t('checkout.addCard')} variant="ghost" size="sm" onPress={() => router.push('/payment-methods')} />

        <TextField label={t('checkout.notes')} value={notes} onChangeText={setNotes} multiline maxLength={500} />

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>{t('checkout.summary')}</Text>
          <Row label={t('cart.subtotal')} value={money(totals.subtotal, language)} />
          {totals.discount > 0 ? <Row label={t('cart.discount', { percent: totals.discountPercent })} value={`-${money(totals.discount, language)}`} green /> : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('cart.total')}</Text>
            <Text style={styles.totalValue}>{money(totals.total, language)}</Text>
          </View>
        </View>
        <Notice message={error} />
        <Text style={styles.note}>{t('checkout.simulated')}</Text>
        <Button title={t('checkout.confirm')} onPress={submit} loading={checkout.isPending} testID="checkout-confirm" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, green && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 10, paddingBottom: 40 },
  section: { fontSize: 13, fontWeight: font.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8 },
  summary: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 8 },
  summaryTitle: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: font.semibold, color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  totalLabel: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  totalValue: { fontSize: 22, fontWeight: font.heavy, color: colors.orange },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
