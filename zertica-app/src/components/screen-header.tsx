import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius } from '@/theme';
import { Avatar } from './avatar';
import { Emoji } from './emoji';
import { Icon, type IconName } from './icon';
import { Logo } from './logo';

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

interface Props {
  title: string;
  subtitle?: string;
  /** Flecha atrás (pantallas internas). */
  back?: boolean;
  /** Elemento a la izquierda del título, como en Figma: logotipo o inicial del administrador. */
  leading?: 'logo' | 'admin' | 'none';
  right?: ReactNode;
  children?: ReactNode;
}

/** Encabezado azul marino de las pantallas de Figma. */
export function ScreenHeader({ title, subtitle, back, leading = 'none', right, children }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        {back ? (
          <Pressable onPress={goBack} style={styles.iconBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="back">
            <Icon name="arrow-left" size={22} color={colors.white} />
          </Pressable>
        ) : leading === 'logo' ? (
          <Logo size={40} />
        ) : leading === 'admin' ? (
          <Avatar name={user?.fullName ?? 'A'} single shape="rounded" size={40} />
        ) : null}
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.actions}>{right}</View>
      </View>
      {children}
    </View>
  );
}

/**
 * Subpágina del perfil (Datos personales, Seguridad…): fila superior con el
 * contexto y banda con "‹ Título" grande, como en Figma.
 */
export function SubpageHeader({ context, contextSubtitle, title }: { context: string; contextSubtitle?: string; title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, styles.subHeader, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        <Logo size={40} />
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {context}
          </Text>
          {contextSubtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {contextSubtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable onPress={goBack} style={styles.band} accessibilityRole="button" accessibilityLabel={`back, ${title}`}>
        <Icon name="chevron-left" size={26} color={colors.white} />
        <Text style={styles.bandTitle} numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

export function HeaderIconButton({
  icon,
  emoji,
  onPress,
  label,
  accent,
}: {
  icon?: IconName;
  emoji?: string;
  onPress: () => void;
  label: string;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconBtn, accent && styles.accentBtn, pressed && { opacity: 0.7 }]}>
      {emoji ? <Emoji char={emoji} size={18} /> : <Icon name={icon ?? 'dots-horizontal'} size={20} color={colors.white} />}
    </Pressable>
  );
}

/** Botón naranja tipo pastilla ("+ Nuevo"). */
export function HeaderPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.pill, pressed && { opacity: 0.8 }]}>
      <Text style={styles.pillText}>+ {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 16, paddingBottom: 14 },
  subHeader: { paddingBottom: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  titles: { flex: 1 },
  title: { color: colors.white, fontSize: 17, fontWeight: font.heavy },
  subtitle: { color: colors.textOnDarkMuted, fontSize: 13, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentBtn: { backgroundColor: colors.orange },
  pill: { backgroundColor: colors.orange, borderRadius: radius.pill, paddingHorizontal: 14, height: 34, justifyContent: 'center' },
  pillText: { color: colors.white, fontWeight: font.bold, fontSize: 14 },
  band: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22, marginLeft: -6 },
  bandTitle: { color: colors.white, fontSize: 22, fontWeight: font.heavy, flex: 1 },
});
