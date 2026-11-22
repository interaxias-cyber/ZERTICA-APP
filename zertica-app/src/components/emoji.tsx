import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

/** Íconos de color como en el diseño de Figma (emoji del sistema). */
export function Emoji({ char, size = 22, dim }: { char: string; size?: number; dim?: boolean }) {
  return (
    <Text style={{ fontSize: size, lineHeight: size * 1.25, opacity: dim ? 0.55 : 1 }} accessible={false}>
      {char}
    </Text>
  );
}

/** Ícono dentro de un recuadro gris claro (filas del perfil y del panel). */
export function EmojiTile({ char, size = 44, style }: { char: string; size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.tile, { width: size, height: size }, style]}>
      <Emoji char={char} size={size * 0.48} />
    </View>
  );
}

export function categoryEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('placa') || n.includes('panel') || n.includes('board')) return '🔲';
  if (n.includes('perfil') || n.includes('profile') || n.includes('stud')) return '📏';
  if (n.includes('masilla') || n.includes('acabado') || n.includes('compound')) return '🪣';
  if (n.includes('tornill') || n.includes('fij') || n.includes('screw')) return '🔩';
  if (n.includes('accesor') || n.includes('herram')) return '📐';
  return '📦';
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
});
