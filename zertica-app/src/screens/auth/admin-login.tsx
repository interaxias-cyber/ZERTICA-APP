import { Link } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View, type TextInput } from 'react-native';
import { Button } from '@/components/button';
import { Emoji } from '@/components/emoji';
import { Notice } from '@/components/notice';
import { TextField } from '@/components/text-field';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius } from '@/theme';
import { AuthShell } from './auth-shell';

/** Pantalla "Acceso administrativo" de Figma: solo cuentas con rol admin (RN06). */
export function AdminLoginScreen() {
  const { t, errorMessage } = useI18n();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = async () => {
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = t('validation.REQUIRED');
    if (!password) next.password = t('validation.REQUIRED');
    setErrors(next);
    setServerError(null);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await signIn(identifier.trim(), password, { admin: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('adminLogin.title')} subtitle={t('adminLogin.subtitle')} back badge={<RestrictedBadge />}>
      <Notice message={serverError} />
      <TextField
        label={t('adminLogin.user')}
        placeholder="admin@zertica.com"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.identifier}
        testID="admin-username"
      />
      <TextField
        ref={passwordRef}
        label={t('auth.password')}
        placeholder={t('auth.passwordPlaceholder')}
        secure
        value={password}
        onChangeText={setPassword}
        returnKeyType="go"
        onSubmitEditing={submit}
        error={errors.password}
        testID="admin-password"
      />
      {__DEV__ ? (
        // Solo en desarrollo, como la caja "Demo" del diseño. No aparece en el APK de producción.
        <View style={styles.demo}>
          <Text style={styles.demoTitle}>{t('adminLogin.demoTitle')}</Text>
          <Text style={styles.mono}>
            {t('adminLogin.demoUser')} admin@zertica.com{'\n'}
            {t('adminLogin.demoPassword')} Admin2026#
          </Text>
        </View>
      ) : null}
      <Button title={`🛡️  ${t('adminLogin.submit')}`} variant="secondary" onPress={submit} loading={loading} testID="admin-submit" />
      <Link href="/forgot-password" asChild>
        <Pressable style={styles.forgot} hitSlop={8} accessibilityRole="link">
          <Text style={styles.link}>{t('adminLogin.forgot')}</Text>
        </Pressable>
      </Link>
    </AuthShell>
  );
}

function RestrictedBadge() {
  const { t } = useI18n();
  return (
    <View style={styles.badge}>
      <Emoji char="🛡️" size={22} />
      <View style={{ flex: 1 }}>
        <Text style={styles.badgeTitle}>{t('adminLogin.badgeTitle')}</Text>
        <Text style={styles.badgeSub}>{t('adminLogin.badgeSubtitle')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 22,
  },
  badgeTitle: { color: colors.navy, fontWeight: font.heavy, fontSize: 13, letterSpacing: 1.2 },
  badgeSub: { color: colors.textMuted, fontSize: 13, marginTop: 1 },
  demo: { backgroundColor: colors.orange100, borderRadius: radius.md, padding: 14, marginBottom: 20, gap: 4 },
  demoTitle: { color: colors.orange, fontWeight: font.bold, fontSize: 13 },
  mono: { fontFamily: 'monospace', fontSize: 13, color: colors.text, lineHeight: 19 },
  forgot: { alignSelf: 'center', marginTop: 18, padding: 4 },
  link: { color: colors.orange, fontWeight: font.semibold, fontSize: 14 },
});
