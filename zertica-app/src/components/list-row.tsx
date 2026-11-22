import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius } from '@/theme';
import { Icon, type IconName } from './icon';

interface Props {
  icon?: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  right?: ReactNode;
  last?: boolean;
  testID?: string;
}

export function ListRow({ icon, title, subtitle, value, onPress, destructive, right, last, testID }: Props) {
  const tint = destructive ? colors.danger : colors.navy;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}>
      {icon ? (
        <View style={[styles.iconBox, destructive && { backgroundColor: colors.dangerBg }]}>
          <Icon name={icon} size={20} color={destructive ? colors.danger : colors.orange} />
        </View>
      ) : null}
      <View style={styles.texts}>
        <Text style={[styles.title, { color: destructive ? colors.danger : colors.text }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {right}
      {onPress && !right ? <Icon name="chevron-right" size={22} color={tint === colors.danger ? colors.danger : '#B3BAC7'} /> : null}
    </Pressable>
  );
}

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { backgroundColor: colors.background },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.orange100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  title: { fontSize: 15, fontWeight: font.semibold },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  value: { fontSize: 14, color: colors.textMuted, maxWidth: '55%', textAlign: 'right' },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: font.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
});
