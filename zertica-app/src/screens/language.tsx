import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Language } from '@/api/types';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { Notice } from '@/components/notice';
import { SubpageHeader } from '@/components/screen-header';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius } from '@/theme';

const OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

/**
 * RF09 Selección de idioma.
 * onboarding: primera pantalla al abrir la app (diagrama de actividades).
 * settings: desde el perfil; se guarda también en la cuenta (users.language).
 */
export function LanguageScreen({ mode }: { mode: 'onboarding' | 'settings' }) {
  const { t, language, setLanguage, previewLanguage, errorMessage } = useI18n();
  const { changeLanguage, user } = useAuth();
  const [selected, setSelected] = useState<Language>(language);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const pick = (code: Language) => {
    setSelected(code);
    // Previsualiza la interfaz en el idioma elegido.
    if (mode === 'onboarding') previewLanguage(code);
  };

  const confirm = async () => {
    setError(null);
    if (mode === 'onboarding') {
      await setLanguage(selected);
      return; // el guard de navegación lleva a inicio de sesión
    }
    setSaving(true);
    try {
      await changeLanguage(selected);
      router.back();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const options = (
    <View style={styles.options}>
      {OPTIONS.map((o) => {
        const active = selected === o.code;
        return (
          <Pressable
            key={o.code}
            onPress={() => pick(o.code)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.option, mode === 'settings' && styles.optionLight, active && styles.optionActive]}>
            <Text style={styles.flag}>{o.flag}</Text>
            <Text style={[styles.optionLabel, mode === 'onboarding' && !active && styles.optionLabelDark]}>{o.label}</Text>
            <Icon
              name={active ? 'radiobox-marked' : 'radiobox-blank'}
              size={22}
              color={active ? colors.orange : mode === 'onboarding' ? colors.textOnDarkMuted : '#B3BAC7'}
            />
          </Pressable>
        );
      })}
    </View>
  );

  if (mode === 'settings') {
    return (
      <View style={styles.flex}>
        <SubpageHeader context={t('profile.title')} contextSubtitle={user?.fullName} title={t('language.screenTitle')} />
        <View style={styles.settingsBody}>
          <Notice message={error} />
          {options}
          <Button title={t('common.save')} onPress={confirm} loading={saving} style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.onboarding, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 28 }]}>
      <Logo size={92} showName />
      <View style={styles.onboardingBody}>
        <Text style={styles.title}>{t('language.title')}</Text>
        <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
        {options}
      </View>
      <Button title={t('language.continue')} onPress={confirm} icon="arrow-right" testID="language-continue" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  settingsBody: { padding: 20 },
  onboarding: { flex: 1, backgroundColor: colors.navy, paddingHorizontal: 24, justifyContent: 'space-between' },
  onboardingBody: { gap: 6 },
  title: { color: colors.white, fontSize: 24, fontWeight: font.heavy },
  subtitle: { color: colors.textOnDarkMuted, fontSize: 14, marginBottom: 18 },
  options: { gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    height: 62,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  optionLight: { backgroundColor: colors.white, borderColor: colors.border },
  optionActive: { borderColor: colors.orange, backgroundColor: colors.white },
  flag: { fontSize: 24 },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: font.bold, color: colors.navy },
  optionLabelDark: { color: colors.white },
});
