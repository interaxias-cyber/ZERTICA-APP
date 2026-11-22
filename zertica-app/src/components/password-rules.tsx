import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { colors, font } from '@/theme';

/** Reglas de contraseña de la pantalla "Seguridad" de Figma; se marcan al cumplirse. */
export function PasswordRules({ value }: { value: string }) {
  const { t } = useI18n();
  const rules = [
    { ok: value.length >= 8, label: t('password.ruleLength') },
    { ok: /[A-Z]/.test(value), label: t('password.ruleUpper') },
    { ok: /\d/.test(value), label: t('password.ruleNumber') },
    { ok: /[^A-Za-z0-9]/.test(value), label: t('password.ruleSpecial') },
  ];
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{t('password.rulesTitle')}</Text>
      {rules.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={[styles.dot, r.ok && styles.ok]}>{r.ok ? '✓' : '•'}</Text>
          <Text style={[styles.text, r.ok && styles.okText]}>{r.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: -2, marginBottom: 18, gap: 3 },
  title: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { color: colors.orange, fontSize: 14, fontWeight: font.heavy, width: 12, textAlign: 'center' },
  ok: { color: colors.success },
  text: { fontSize: 13, color: colors.textMuted },
  okText: { color: colors.success },
});
