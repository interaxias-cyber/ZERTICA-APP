import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { colors, font, radius } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  compact?: boolean;
  children: ReactNode;
}

/** Composición de la pantalla de acceso de la presentación: cabecera azul con logo y hoja clara. */
export function AuthShell({ title, subtitle, back, compact, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}>
        <View style={[styles.hero, { paddingTop: insets.top + (compact ? 16 : 40) }, compact && styles.heroCompact]}>
          {back ? (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
              style={[styles.back, { top: insets.top + 12 }]}
              accessibilityRole="button"
              accessibilityLabel="back"
              hitSlop={8}>
              <Icon name="arrow-left" size={22} color={colors.white} />
            </Pressable>
          ) : null}
          <Logo size={compact ? 56 : 76} showName={!compact} />
        </View>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
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
  back: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  title: { fontSize: 26, fontWeight: font.heavy, color: colors.navy },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  content: { marginTop: 22 },
});
