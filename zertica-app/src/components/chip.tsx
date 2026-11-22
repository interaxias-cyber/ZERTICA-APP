import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, radius } from '@/theme';
import { Icon, type IconName } from './icon';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}

export function Chip({ label, selected, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && !selected && styles.pressed]}>
      {icon ? <Icon name={icon} size={16} color={selected ? colors.white : colors.navy} /> : null}
      <Text style={[styles.text, selected && styles.textSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.white,
  },
  selected: { backgroundColor: colors.orange, borderColor: colors.orange },
  pressed: { backgroundColor: colors.navy100 },
  text: { fontSize: 14, fontWeight: font.medium, color: colors.textBody },
  textSelected: { color: colors.white },
});
