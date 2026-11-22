import { Link } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, View, type TextInput } from 'react-native';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { TextField } from '@/components/text-field';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';
import { colors, font } from '@/theme';
import { AuthShell } from './auth-shell';

/** CU-03 Iniciar sesión (usuario y contraseña). */
export function LoginScreen() {
  const { t, errorMessage, language, setLanguage } = useI18n();
  const { signIn, sessionNotice, clearSessionNotice } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = async () => {
    const next: typeof errors = {};
    if (!username.trim()) next.username = t('validation.REQUIRED');
    if (!password) next.password = t('validation.REQUIRED');
    setErrors(next);
    setServerError(null);
    clearSessionNotice();
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await signIn(username.trim(), password);
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
        label={t('auth.username')}
        placeholder={t('auth.usernamePlaceholder')}
        icon="account-outline"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.username}
        testID="login-username"
      />
      <TextField
        ref={passwordRef}
        label={t('auth.password')}
        placeholder={t('auth.passwordPlaceholder')}
        icon="lock-outline"
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
      <Button title={t('auth.login')} onPress={submit} loading={loading} testID="login-submit" />
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
  forgotRow: { alignItems: 'flex-end', marginTop: -4, marginBottom: 20 },
  link: { color: colors.orange, fontWeight: font.bold, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  muted: { color: colors.textMuted, fontSize: 14 },
  lang: { alignSelf: 'center', marginTop: 22, padding: 6 },
  langText: { color: colors.navy700, fontSize: 13, fontWeight: font.semibold, textDecorationLine: 'underline' },
});
