import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { profileApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { Button } from '@/components/button';
import { Notice } from '@/components/notice';
import { Avatar } from '@/components/avatar';
import { SubpageHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { useI18n } from '@/i18n';
import { apiFieldErrors, EMAIL_RE, type FieldErrors } from '@/lib/forms';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

/** CU-07 Editar perfil (nombre y correo). */
export function EditProfileScreen() {
  const { t, errorMessage, fieldMessage } = useI18n();
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const e: FieldErrors = {};
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();
    if (!name) e.fullName = t('validation.REQUIRED');
    else if (name.length < 3 || name.length > 120) e.fullName = t('validation.INVALID_LENGTH');
    if (!mail) e.email = t('validation.REQUIRED');
    else if (!EMAIL_RE.test(mail)) e.email = t('validation.INVALID_FORMAT');
    setErrors(e);
    setServerError(null);
    if (Object.values(e).some(Boolean)) return;
    setSaving(true);
    try {
      const updated = await profileApi.update({ fullName: name, email: mail });
      await updateUser(updated);
      router.back();
    } catch (err) {
      const fields = apiFieldErrors(err, fieldMessage);
      setErrors(fields);
      if (!(err instanceof ApiError) || Object.keys(fields).length === 0) setServerError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SubpageHeader context={t('profile.title')} contextSubtitle={user?.fullName} title={t('profile.personalData')} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.avatar}>
          <Avatar name={fullName || user?.fullName || '?'} size={96} />
        </View>
        <Notice message={serverError} />
        <TextField label={t('profile.username')} value={user?.username ?? ''} editable={false} />
        <TextField
          label={t('auth.fullName')}
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
        />
        <TextField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          onSubmitEditing={submit}
        />
        <Button title={t('profile.saveChanges')} onPress={submit} loading={saving} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20 },
  avatar: { alignItems: 'center', marginBottom: 18 },
});
