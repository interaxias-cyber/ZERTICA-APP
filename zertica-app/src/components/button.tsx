import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font, radius } from '@/theme';
import { Icon, type IconName } from './icon';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const palette: Record<Variant, { bg: string; fg: string; border?: string; pressed: string }> = {
  primary: { bg: colors.orange, fg: colors.white, pressed: colors.orangeDark },
  secondary: { bg: colors.navy, fg: colors.white, pressed: colors.navy700 },
  outline: { bg: 'transparent', fg: colors.navy, border: colors.border, pressed: colors.navy100 },
  ghost: { bg: 'transparent', fg: colors.orange, pressed: colors.orange100 },
  danger: { bg: colors.dangerBg, fg: colors.danger, pressed: '#F8D4D4' },
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, size = 'md', style, testID }: Props) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        { backgroundColor: pressed ? p.pressed : p.bg, borderColor: p.border ?? 'transparent' },
        inactive && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 18 : 20} color={p.fg} /> : null}
          <Text style={[styles.text, size === 'sm' && styles.textSm, { color: p.fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sm: { minHeight: 38, paddingHorizontal: 12, borderRadius: radius.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 15, fontWeight: font.bold },
  textSm: { fontSize: 13 },
  disabled: { opacity: 0.55 },
});
