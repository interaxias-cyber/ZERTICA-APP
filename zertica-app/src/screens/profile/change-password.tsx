import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { profileApi } from '@/api/auth';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { useI18n } from '@/i18n';
import { apiFieldErrors, PASSWORD_RE, type FieldErrors } from '@/lib/forms';
import { colors } from '@/theme';

/** CU-08 Cambiar contraseña (verifica la actual en el backend). */
export function ChangePasswordScreen() {
  const { t, errorMessage, fieldMessage } = useI18n();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const e: FieldErrors = {};
    if (!current) e.currentPassword = t('validation.REQUIRED');
    if (!next) e.newPassword = t('validation.REQUIRED');
    else if (!PASSWORD_RE.test(next)) e.newPassword = t('validation.WEAK_PASSWORD');
    else if (next === current) e.newPassword = t('validation.SAME_AS_CURRENT');
    if (next && confirm !== next) e.confirm = t('validation.PASSWORD_MISMATCH');
    setErrors(e);
    setServerError(null);
    setDone(false);
    if (Object.values(e).some(Boolean)) return;
    setSaving(true);
    try {
      await profileApi.changePassword(current, next);
      setDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      const fields = apiFieldErrors(err, fieldMessage);
      setErrors(fields);
      if (Object.keys(fields).length === 0) setServerError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={t('profile.passwordTitle')} back />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Notice message={serverError} />
        {done ? <Notice tone="success" message={t('profile.passwordChanged')} /> : null}
        <TextField
          label={t('profile.currentPassword')}
          value={current}
          onChangeText={setCurrent}
          secure
          icon="lock-outline"
          error={errors.currentPassword}
        />
        <TextField
          label={t('auth.newPassword')}
          value={next}
          onChangeText={setNext}
          secure
          icon="lock-plus-outline"
          hint={t('auth.passwordHint')}
          error={errors.newPassword}
        />
        <TextField
          label={t('auth.confirmPassword')}
          value={confirm}
          onChangeText={setConfirm}
          secure
          icon="lock-check-outline"
          error={errors.confirm}
          onSubmitEditing={submit}
        />
        <Button title={t('common.save')} onPress={submit} loading={saving} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20 },
});
