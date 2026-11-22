import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { colors, font, radius } from '@/theme';

export function StatusBadge({ active, label }: { active: boolean; label?: string }) {
  const { t } = useI18n();
  return (
    <View style={[styles.badge, { backgroundColor: active ? colors.successBg : colors.dangerBg }]}>
      <View style={[styles.dot, { backgroundColor: active ? colors.success : colors.danger }]} />
      <Text style={[styles.text, { color: active ? colors.success : colors.danger }]}>
        {label ?? (active ? t('common.active') : t('common.inactive'))}
      </Text>
    </View>
  );
}

export function Tag({ label, tone = 'navy' }: { label: string; tone?: 'navy' | 'orange' | 'muted' }) {
  const bg = tone === 'orange' ? colors.orange100 : tone === 'navy' ? colors.navy100 : colors.divider;
  const fg = tone === 'orange' ? colors.orangeDark : tone === 'navy' ? colors.navy700 : colors.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: font.bold },
});
