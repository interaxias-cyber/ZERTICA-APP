import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { authApi } from '@/api/auth';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { PasswordRules } from '@/components/password-rules';
import { TextField } from '@/components/text-field';
import { useI18n } from '@/i18n';
import { apiFieldErrors, PASSWORD_RE, type FieldErrors } from '@/lib/forms';
import { AuthShell } from './auth-shell';

/** CU-04 (continuación): restablecer con el código recibido. */
export function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const { t, errorMessage, fieldMessage } = useI18n();
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: FieldErrors = {};
    if (!token.trim()) e.token = t('validation.REQUIRED');
    if (!password) e.password = t('validation.REQUIRED');
    else if (!PASSWORD_RE.test(password)) e.password = t('validation.WEAK_PASSWORD');
    if (password && confirm !== password) e.confirm = t('validation.PASSWORD_MISMATCH');
    setErrors(e);
    setServerError(null);
    if (Object.values(e).some(Boolean)) return;
    setLoading(true);
    try {
      await authApi.resetPassword(token.trim(), password);
      setDone(true);
    } catch (err) {
      setErrors(apiFieldErrors(err, fieldMessage));
      setServerError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')} back compact>
      <Notice message={serverError} />
      {done ? (
        <>
          <Notice tone="success" message={t('auth.resetDone')} />
          <Button title={t('auth.goLogin')} onPress={() => router.dismissTo('/login')} />
        </>
      ) : (
        <>
          <TextField
            label={t('auth.code')}
            placeholder={t('auth.codePlaceholder')}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.token}
          />
          <TextField
            label={t('auth.newPassword')}
            placeholder={t('auth.passwordPlaceholder')}
            secure
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          <PasswordRules value={password} />
          <TextField
            label={t('auth.confirmPassword')}
            placeholder={t('auth.passwordPlaceholder')}
            secure
            value={confirm}
            onChangeText={setConfirm}
            onSubmitEditing={submit}
            error={errors.confirm}
          />
          <Button title={t('auth.resetButton')} onPress={submit} loading={loading} />
        </>
      )}
    </AuthShell>
  );
}
