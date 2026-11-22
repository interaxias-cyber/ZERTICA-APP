import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { useI18n } from '@/i18n';
import { colors, font } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  compact?: boolean;
  /** Elemento sobre el título (p. ej. aviso de acceso restringido). */
  badge?: ReactNode;
  children: ReactNode;
}

/** Composición de la pantalla de acceso de la presentación: cabecera azul con logo y hoja clara. */
export function AuthShell({ title, subtitle, back, compact, badge, children }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}>
        <View style={[styles.hero, { paddingTop: insets.top + (compact ? 52 : back ? 64 : 44) }, compact && styles.heroCompact]}>
          {back ? (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
              style={[styles.back, { top: insets.top + 12 }]}
              accessibilityRole="button"
              hitSlop={8}>
              <Icon name="arrow-left" size={20} color={colors.textOnDarkMuted} />
              <Text style={styles.backText}>{t('adminLogin.back')}</Text>
            </Pressable>
          ) : null}
          <Logo size={compact ? 64 : 88} showName={!compact} />
        </View>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
          {badge}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.content}>{children}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.navy },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingBottom: 34 },
  heroCompact: { paddingBottom: 24 },
  back: { position: 'absolute', left: 18, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 1, padding: 4 },
  backText: { color: colors.textOnDarkMuted, fontSize: 16 },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  title: { fontSize: 27, fontWeight: font.heavy, color: colors.navy },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 4, lineHeight: 21 },
  content: { marginTop: 22 },
});
