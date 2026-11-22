import { router } from 'expo-router';
import { useState } from 'react';
import { authApi } from '@/api/auth';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { TextField } from '@/components/text-field';
import { useI18n } from '@/i18n';
import { EMAIL_RE } from '@/lib/forms';
import { AuthShell } from './auth-shell';

/** CU-04 Recuperar contraseña. */
export function ForgotPasswordScreen() {
  const { t, errorMessage } = useI18n();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const value = email.trim().toLowerCase();
    if (!value) return setError(t('validation.REQUIRED'));
    if (!EMAIL_RE.test(value)) return setError(t('validation.INVALID_FORMAT'));
    setError(null);
    setServerError(null);
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(value);
      setSent(true);
      setDevToken(res.devResetToken ?? null);
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')} back compact>
      <Notice message={serverError} />
      {sent ? <Notice tone="success" message={t('auth.forgotSent')} /> : null}
      {devToken ? <Notice tone="info" message={t('auth.devCodeNotice')} /> : null}
      <TextField
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        onSubmitEditing={submit}
        error={error}
      />
      <Button title={t('auth.sendInstructions')} onPress={submit} loading={loading} />
      <Button
        title={t('auth.haveCode')}
        variant="ghost"
        style={{ marginTop: 10 }}
        onPress={() => router.push({ pathname: '/reset-password', params: devToken ? { token: devToken } : {} })}
      />
    </AuthShell>
  );
}
