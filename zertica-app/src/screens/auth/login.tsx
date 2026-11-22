import { Link, router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View, type TextInput } from 'react-native';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { TextField } from '@/components/text-field';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';
import { colors, font } from '@/theme';
import { AuthShell } from './auth-shell';

/** CU-03 Iniciar sesión — pantalla "Iniciar sesión" de Figma. Acepta correo o usuario. */
export function LoginScreen() {
  const { t, errorMessage, language, setLanguage } = useI18n();
  const { signIn, sessionNotice, clearSessionNotice } = useAuth();
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
    clearSessionNotice();
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await signIn(identifier.trim(), password);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const notice = sessionNotice ? t(`errors.${sessionNotice}` as 'errors.SESSION_EXPIRED') : null;

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <Notice tone="info" message={notice} />
      <Notice message={serverError} />
      <TextField
        label={t('auth.identifier')}
        placeholder={t('auth.identifierPlaceholder')}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.identifier}
        testID="login-username"
      />
      <TextField
        ref={passwordRef}
        label={t('auth.password')}
        placeholder={t('auth.passwordPlaceholder')}
        secure
        value={password}
        onChangeText={setPassword}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={errors.password}
        testID="login-password"
      />
      <View style={styles.forgotRow}>
        <Link href="/forgot-password" asChild>
          <Pressable hitSlop={8} accessibilityRole="link">
            <Text style={styles.link}>{t('auth.forgot')}</Text>
          </Pressable>
        </Link>
      </View>
      <Button title={t('auth.loginAsUser')} onPress={submit} loading={loading} testID="login-submit" />
      <Button
        title={`🛡️  ${t('auth.adminAccess')}`}
        variant="secondary"
        onPress={() => router.push('/admin-login')}
        style={styles.adminBtn}
        testID="login-admin"
      />
      <View style={styles.footer}>
        <Text style={styles.muted}>{t('auth.noAccount')} </Text>
        <Link href="/register" asChild>
          <Pressable hitSlop={8} accessibilityRole="link">
            <Text style={styles.link}>{t('auth.register')}</Text>
          </Pressable>
        </Link>
      </View>
      <Pressable style={styles.lang} onPress={() => setLanguage(language === 'es' ? 'en' : 'es')} accessibilityRole="button">
        <Text style={styles.langText}>🌐 {language === 'es' ? 'English' : 'Español'}</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgotRow: { alignItems: 'flex-end', marginTop: -2, marginBottom: 22 },
  link: { color: colors.orange, fontWeight: font.bold, fontSize: 14 },
  adminBtn: { marginTop: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  muted: { color: colors.textMuted, fontSize: 15 },
  lang: { alignSelf: 'center', marginTop: 18, padding: 6 },
  langText: { color: colors.navy800, fontSize: 13, fontWeight: font.semibold },
});
