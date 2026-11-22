import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '@/theme';
import { Emoji } from './emoji';
import { Icon } from './icon';

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  right?: ReactNode;
  testID?: string;
}

/** Opción seleccionable (dirección o método de pago en "Finalizar compra"). */
export function SelectCard({ emoji, title, subtitle, selected, onPress, disabled, right, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      style={[styles.card, selected && styles.selected, disabled && { opacity: 0.5 }]}>
      <Emoji char={emoji} size={22} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
      <Icon name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={selected ? colors.orange : '#C4C8D0'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  selected: { borderColor: colors.orange },
  title: { fontSize: 15, fontWeight: font.bold, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
