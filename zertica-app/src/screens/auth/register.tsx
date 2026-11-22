import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { TextField } from '@/components/text-field';
import { useI18n } from '@/i18n';
import { apiFieldErrors, EMAIL_RE, PASSWORD_RE, USERNAME_RE, type FieldErrors } from '@/lib/forms';
import { useAuth } from '@/providers/auth-provider';
import { colors, font } from '@/theme';
import { AuthShell } from './auth-shell';

/** CU-01 Registrarse + CU-02 Validar datos de registro. */
export function RegisterScreen() {
  const { t, errorMessage, fieldMessage } = useI18n();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    const fullName = form.fullName.trim();
    if (!fullName) e.fullName = t('validation.REQUIRED');
    else if (fullName.length < 3 || fullName.length > 120) e.fullName = t('validation.INVALID_LENGTH');
    if (!form.username.trim()) e.username = t('validation.REQUIRED');
    else if (!USERNAME_RE.test(form.username.trim())) e.username = t('validation.USERNAME_FORMAT');
    if (!form.email.trim()) e.email = t('validation.REQUIRED');
    else if (!EMAIL_RE.test(form.email.trim())) e.email = t('validation.INVALID_FORMAT');
    if (!form.password) e.password = t('validation.REQUIRED');
    else if (!PASSWORD_RE.test(form.password)) e.password = t('validation.WEAK_PASSWORD');
    if (form.password && form.confirm !== form.password) e.confirm = t('validation.PASSWORD_MISMATCH');
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    setServerError(null);
    if (Object.values(e).some(Boolean)) return;
    setLoading(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
    } catch (err) {
      const fields = apiFieldErrors(err, fieldMessage);
      setErrors(fields);
      if (!(err instanceof ApiError) || Object.keys(fields).length === 0) setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} back compact>
      <Notice message={serverError} />
      <TextField
        label={t('auth.fullName')}
        placeholder={t('auth.fullNamePlaceholder')}
        icon="card-account-details-outline"
        value={form.fullName}
        onChangeText={set('fullName')}
        autoComplete="name"
        error={errors.fullName}
      />
      <TextField
        label={t('auth.username')}
        placeholder={t('auth.usernamePlaceholder')}
        icon="account-outline"
        value={form.username}
        onChangeText={set('username')}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        error={errors.username}
      />
      <TextField
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
        icon="email-outline"
        value={form.email}
        onChangeText={set('email')}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        error={errors.email}
      />
      <TextField
        label={t('auth.password')}
        placeholder={t('auth.passwordPlaceholder')}
        icon="lock-outline"
        secure
        value={form.password}
        onChangeText={set('password')}
        autoComplete="new-password"
        hint={t('auth.passwordHint')}
        error={errors.password}
      />
      <TextField
        label={t('auth.confirmPassword')}
        placeholder={t('auth.passwordPlaceholder')}
        icon="lock-check-outline"
        secure
        value={form.confirm}
        onChangeText={set('confirm')}
        autoComplete="new-password"
        onSubmitEditing={submit}
        error={errors.confirm}
      />
      <Button title={t('auth.createAccount')} onPress={submit} loading={loading} style={{ marginTop: 6 }} />
      <View style={styles.footer}>
        <Text style={styles.muted}>{t('auth.haveAccount')} </Text>
        <Link href="/login" dismissTo asChild>
          <Pressable hitSlop={8} accessibilityRole="link">
            <Text style={styles.link}>{t('auth.goLogin')}</Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22 },
  muted: { color: colors.textMuted, fontSize: 14 },
  link: { color: colors.orange, fontWeight: font.bold, fontSize: 14 },
});
