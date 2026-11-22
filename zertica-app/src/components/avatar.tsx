import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '@/theme';

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

interface Props {
  name: string;
  size?: number;
  /** circle: perfil y listas; rounded: encabezados (como en Figma). */
  shape?: 'circle' | 'rounded';
  tone?: 'orange' | 'navy';
  /** Muestra solo la primera letra (encabezado del administrador). */
  single?: boolean;
}

export function Avatar({ name, size = 40, shape = 'circle', tone = 'orange', single }: Props) {
  const text = single ? (name.trim()[0] ?? '?').toUpperCase() : initials(name);
  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: shape === 'circle' ? size / 2 : radius.md * (size / 44),
          backgroundColor: tone === 'orange' ? colors.orange : colors.navy800,
        },
      ]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontWeight: font.heavy },
});
