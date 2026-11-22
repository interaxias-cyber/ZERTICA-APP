import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme';
import { Icon, categoryIcon } from './icon';

interface Props {
  uri: string | null;
  categoryName?: string;
  style?: StyleProp<ViewStyle>;
  label?: string;
  iconSize?: number;
}

/** Imagen del producto; si no tiene (datos de ejemplo), muestra un marcador. */
export function ProductImage({ uri, categoryName = '', style, label, iconSize = 34 }: Props) {
  if (!uri) {
    return (
      <View style={[styles.placeholder, style]}>
        <Icon name={categoryIcon(categoryName)} size={iconSize} color={colors.navy700} />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[styles.image, style as object]}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.navy100 },
  placeholder: {
    backgroundColor: colors.navy100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: { fontSize: 11, color: colors.textMuted },
});
