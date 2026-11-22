import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { Address } from '@/api/types';
import { Button } from '@/components/button';
import { Emoji } from '@/components/emoji';
import { Notice } from '@/components/notice';
import { SubpageHeader } from '@/components/screen-header';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Tag } from '@/components/status-badge';
import { TextField } from '@/components/text-field';
import { useAddresses, useAddressMutations } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { confirmAction, showMessage } from '@/lib/confirm';
import { apiFieldErrors, type FieldErrors } from '@/lib/forms';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius, shadow } from '@/theme';

/** Pantalla "Mis direcciones" de Figma. */
export function AddressesScreen() {
  const { t, errorMessage } = useI18n();
  const { user } = useAuth();
  const query = useAddresses();
  const { remove } = useAddressMutations();

  const onDelete = async (a: Address) => {
    const ok = await confirmAction(t('addresses.deleteTitle'), t('addresses.deleteBody', { name: a.label }), t('common.delete'), t('common.cancel'), true);
    if (!ok) return;
    remove.mutate(a.id, { onError: (e) => showMessage(t('addresses.title'), errorMessage(e)) });
  };

  return (
    <View style={styles.flex}>
      <SubpageHeader context={t('profile.title')} contextSubtitle={user?.fullName} title={t('addresses.title')} />
      {query.isPending ? (
        <LoadingView />
      ) : query.isError ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {query.data.length === 0 ? <EmptyView icon="map-marker-outline" title={t('addresses.emptyTitle')} /> : null}
          {query.data.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Emoji char="📍" size={20} />
                <Text style={styles.label}>{a.label}</Text>
                {a.isDefault ? <Tag tone="success" label={t('common.default')} /> : null}
                <View style={{ flex: 1 }} />
                <Pressable
                  style={styles.smallBtn}
                  onPress={() => router.push({ pathname: '/addresses/[id]', params: { id: String(a.id) } })}
                  accessibilityRole="button">
                  <Text style={styles.smallText}>{t('common.edit')}</Text>
                </Pressable>
                <Pressable style={[styles.smallBtn, styles.del]} onPress={() => onDelete(a)} accessibilityRole="button" accessibilityLabel={t('common.delete')}>
                  <Text style={[styles.smallText, { color: colors.danger }]}>✕</Text>
                </Pressable>
              </View>
              <Text style={styles.line}>
                {a.line1}, {a.city}
                {a.postalCode ? ` ${a.postalCode}` : ''}
              </Text>
            </View>
          ))}
          <Pressable style={styles.addBtn} onPress={() => router.push('/addresses/new')} accessibilityRole="button" testID="address-add">
            <Text style={styles.addText}>{t('addresses.add')}</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

/** Alta / edición de dirección. */
export function AddressFormScreen({ id }: { id: number | null }) {
  const { t, errorMessage, fieldMessage } = useI18n();
  const query = useAddresses();
  const current = query.data?.find((a) => a.id === id);
  if (id && query.isPending) return <LoadingView />;
  return <AddressForm key={current?.id ?? 'new'} id={id} initial={current} t={t} errorMessage={errorMessage} fieldMessage={fieldMessage} />;
}

function AddressForm({
  id,
  initial,
  t,
  errorMessage,
  fieldMessage,
}: {
  id: number | null;
  initial?: Address;
  t: ReturnType<typeof useI18n>['t'];
  errorMessage: (e: unknown) => string;
  fieldMessage: (c: string) => string;
}) {
  const { user } = useAuth();
  const { save } = useAddressMutations();
  const [label, setLabel] = useState(initial?.label ?? '');
  const [line1, setLine1] = useState(initial?.line1 ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = async () => {
    const e: FieldErrors = {};
    if (!label.trim()) e.label = t('validation.REQUIRED');
    if (!line1.trim()) e.line1 = t('validation.REQUIRED');
    if (!city.trim()) e.city = t('validation.REQUIRED');
    setErrors(e);
    setServerError(null);
    if (Object.values(e).some(Boolean)) return;
    try {
      await save.mutateAsync({ id, input: { label: label.trim(), line1: line1.trim(), city: city.trim(), postalCode: postalCode.trim(), isDefault } });
      router.back();
    } catch (err) {
      const f = apiFieldErrors(err, fieldMessage);
      setErrors(f);
      if (!Object.keys(f).length) setServerError(errorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SubpageHeader context={t('addresses.title')} contextSubtitle={user?.fullName} title={id ? t('addresses.editTitle') : t('addresses.newTitle')} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Notice message={serverError} />
        <TextField label={t('addresses.label')} value={label} onChangeText={setLabel} maxLength={50} error={errors.label} />
        <TextField label={t('addresses.line1')} value={line1} onChangeText={setLine1} maxLength={200} error={errors.line1} />
        <TextField label={t('addresses.city')} value={city} onChangeText={setCity} maxLength={100} error={errors.city} />
        <TextField label={t('addresses.postalCode')} value={postalCode} onChangeText={setPostalCode} maxLength={20} keyboardType="number-pad" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('addresses.makeDefault')}</Text>
          <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: colors.orange, false: colors.border }} thumbColor={colors.white} />
        </View>
        <Button title={t('common.save')} onPress={submit} loading={save.isPending} testID="address-save" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 8, ...shadow.card },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  smallBtn: { backgroundColor: colors.chip, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  del: { backgroundColor: colors.dangerBg },
  smallText: { fontSize: 14, fontWeight: font.semibold, color: colors.text },
  line: { fontSize: 14, color: colors.textBody, marginLeft: 28 },
  addBtn: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.orange, borderRadius: radius.lg, height: 58, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.orange, fontWeight: font.bold, fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  switchLabel: { fontSize: 15, color: colors.text, flex: 1 },
});
