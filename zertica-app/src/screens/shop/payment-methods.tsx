import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PaymentMethod } from '@/api/types';
import { Button } from '@/components/button';
import { Emoji, EmojiTile } from '@/components/emoji';
import { Icon } from '@/components/icon';
import { Notice } from '@/components/notice';
import { SubpageHeader } from '@/components/screen-header';
import { ErrorView, LoadingView } from '@/components/state-views';
import { TextField } from '@/components/text-field';
import { usePaymentMethods, usePaymentMutations } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { confirmAction, showMessage } from '@/lib/confirm';
import { apiFieldErrors, type FieldErrors } from '@/lib/forms';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { colors, font, radius, shadow } from '@/theme';

/** Formatea "4242424242424242" → "4242 4242 4242 4242". */
const groupDigits = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();

/** "1229" → "12/29". */
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Pantalla "Métodos de pago" de Figma. Solo se guarda marca y últimos 4 dígitos. */
export function PaymentMethodsScreen() {
  const { t, errorMessage, fieldMessage } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const query = usePaymentMethods();
  const { add, remove } = usePaymentMutations();
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holderName, setHolderName] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const onDelete = async (p: PaymentMethod) => {
    const ok = await confirmAction(t('payments.deleteTitle'), t('payments.deleteBody', { last4: p.last4 }), t('common.delete'), t('common.cancel'), true);
    if (!ok) return;
    remove.mutate(p.id, { onError: (e) => showMessage(t('payments.title'), errorMessage(e)) });
  };

  const submit = async () => {
    const e: FieldErrors = {};
    if (!number.trim()) e.number = t('validation.REQUIRED');
    if (!expiry.trim()) e.expiry = t('validation.REQUIRED');
    if (!cvv.trim()) e.cvv = t('validation.REQUIRED');
    if (!holderName.trim()) e.holderName = t('validation.REQUIRED');
    setErrors(e);
    setServerError(null);
    if (Object.values(e).some(Boolean)) return;
    try {
      await add.mutateAsync({ number, expiry, cvv, holderName });
      setNumber('');
      setExpiry('');
      setCvv('');
      setHolderName('');
      toast(t('payments.added'));
    } catch (err) {
      const f = apiFieldErrors(err, fieldMessage);
      setErrors(f);
      if (!Object.keys(f).length) setServerError(errorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SubpageHeader context={t('profile.title')} contextSubtitle={user?.fullName} title={t('payments.title')} />
      {query.isPending ? (
        <LoadingView />
      ) : query.isError ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {query.data.map((p) => (
            <View key={p.id} style={styles.card}>
              <EmojiTile char="💳" size={48} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {p.brandName} •••• {p.last4}
                </Text>
                <Text style={[styles.muted, p.isExpired && { color: colors.danger }]}>
                  {p.isExpired ? t('payments.expired') : t('payments.expires', { date: `${String(p.expMonth).padStart(2, '0')}/${String(p.expYear).slice(-2)}` })}
                </Text>
              </View>
              <Pressable style={styles.del} onPress={() => onDelete(p)} accessibilityRole="button">
                <Text style={styles.delText}>{t('common.delete')}</Text>
              </Pressable>
            </View>
          ))}

          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('payments.addTitle')}</Text>
            <Notice message={serverError} />
            <TextField
              label={t('payments.number')}
              placeholder="0000 0000 0000 0000"
              value={number}
              onChangeText={(v) => setNumber(groupDigits(v))}
              keyboardType="number-pad"
              error={errors.number}
              testID="card-number"
            />
            <View style={styles.twoCols}>
              <View style={{ flex: 1 }}>
                <TextField label={t('payments.expiry')} placeholder="MM/AA" value={expiry} onChangeText={(v) => setExpiry(formatExpiry(v))} keyboardType="number-pad" error={errors.expiry} testID="card-expiry" />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label={t('payments.cvv')} placeholder="•••" value={cvv} onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secure error={errors.cvv} testID="card-cvv" />
              </View>
            </View>
            <TextField
              label={t('payments.holder')}
              placeholder={t('payments.holderPlaceholder')}
              value={holderName}
              onChangeText={setHolderName}
              autoCapitalize="characters"
              error={errors.holderName}
              testID="card-holder"
            />
            <Button title={t('payments.addButton')} onPress={submit} loading={add.isPending} testID="card-add" />
            <View style={styles.security}>
              <Icon name="shield-lock-outline" size={16} color={colors.textMuted} />
              <Text style={styles.securityText}>{t('payments.securityNote')}</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('payments.other')}</Text>
            <Pressable style={styles.otherRow} onPress={() => showMessage(t('payments.transfer'), t('payments.transferInfo'))} accessibilityRole="button">
              <Emoji char="💰" size={22} />
              <Text style={styles.otherText}>{t('payments.transfer')}</Text>
              <Icon name="chevron-right" size={22} color="#9CA3AF" />
            </Pressable>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow.card },
  cardTop: { flexDirection: 'row' },
  cardTitle: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  muted: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  del: { backgroundColor: colors.dangerBg, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 7 },
  delText: { color: colors.danger, fontWeight: font.semibold, fontSize: 14 },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, ...shadow.card },
  formTitle: { fontSize: 17, fontWeight: font.bold, color: colors.text, marginBottom: 12 },
  twoCols: { flexDirection: 'row', gap: 12 },
  security: { flexDirection: 'row', gap: 6, marginTop: 12, alignItems: 'flex-start' },
  securityText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  otherRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  otherText: { flex: 1, fontSize: 16, color: colors.text },
});
