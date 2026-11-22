import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { colors, font, radius } from '@/theme';

type Tone = 'success' | 'muted' | 'navy' | 'orange' | 'danger' | 'warning' | 'info' | 'chip';

const tones: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.successBg, fg: colors.success },
  muted: { bg: colors.chip, fg: colors.textBody },
  chip: { bg: colors.chip, fg: colors.navy },
  navy: { bg: colors.navy800, fg: colors.white },
  orange: { bg: colors.orange, fg: colors.white },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  warning: { bg: colors.warningBg, fg: colors.warning },
  info: { bg: colors.infoBg, fg: colors.info },
};

/** Pastillas de estado del diseño ("Activo" verde, "Inactivo" gris). */
export function StatusBadge({ active, label }: { active: boolean; label?: string }) {
  const { t } = useI18n();
  return <Tag tone={active ? 'success' : 'muted'} label={label ?? (active ? t('common.active') : t('common.inactive'))} />;
}

export function Tag({ label, tone = 'chip' }: { label: string; tone?: Tone }) {
  const c = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  text: { fontSize: 12, fontWeight: font.semibold },
});
