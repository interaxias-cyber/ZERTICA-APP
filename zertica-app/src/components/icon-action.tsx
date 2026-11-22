import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme';
import { Icon, type IconName } from './icon';

const tones = {
  info: { bg: colors.infoBg, fg: colors.info },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  success: { bg: colors.successBg, fg: colors.success },
};

/** Botón pequeño de acción en filas (lápiz azul / acción roja de Figma). */
export function IconAction({
  icon,
  tone,
  label,
  onPress,
  loading,
}: {
  icon: IconName;
  tone: keyof typeof tones;
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const c = tones[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, { backgroundColor: c.bg }, pressed && { opacity: 0.7 }]}>
      {loading ? <ActivityIndicator size="small" color={c.fg} /> : <Icon name={icon} size={18} color={c.fg} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 34, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
