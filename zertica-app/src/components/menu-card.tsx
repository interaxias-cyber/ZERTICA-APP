import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow } from '@/theme';
import { EmojiTile } from './emoji';
import { Icon } from './icon';

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
}

/** Tarjeta de menú del perfil (Figma: ícono en recuadro, título, subtítulo y "›"). */
export function MenuCard({ emoji, title, subtitle, onPress, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <EmojiTile char={emoji} />
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Icon name="chevron-right" size={22} color="#9CA3AF" />
    </Pressable>
  );
}

/** Tarjeta con 3 cifras bajo el encabezado del perfil. */
export function StatsCard({ items }: { items: { value: string; label: string }[] }) {
  return (
    <View style={styles.stats}>
      {items.map((it, i) => (
        <View key={it.label} style={[styles.stat, i > 0 && styles.statDivider]}>
          <Text style={styles.statValue} numberOfLines={1}>
            {it.value}
          </Text>
          <Text style={styles.statLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    ...shadow.card,
  },
  texts: { flex: 1 },
  title: { fontSize: 16, fontWeight: font.bold, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: -26,
    marginBottom: 16,
    ...shadow.card,
  },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statValue: { fontSize: 18, fontWeight: font.heavy, color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
