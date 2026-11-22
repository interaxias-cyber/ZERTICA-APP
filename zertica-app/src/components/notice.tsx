import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';
import { Icon } from './icon';

type Tone = 'error' | 'success' | 'info';

const tones: Record<Tone, { bg: string; fg: string; icon: 'alert-circle-outline' | 'check-circle-outline' | 'information-outline' }> = {
  error: { bg: colors.dangerBg, fg: colors.danger, icon: 'alert-circle-outline' },
  success: { bg: colors.successBg, fg: colors.success, icon: 'check-circle-outline' },
  info: { bg: colors.navy100, fg: colors.navy700, icon: 'information-outline' },
};

/** Mensaje en línea para errores del servidor o confirmaciones. */
export function Notice({ tone = 'error', message }: { tone?: Tone; message?: string | null }) {
  if (!message) return null;
  const t = tones[tone];
  return (
    <View style={[styles.box, { backgroundColor: t.bg }]} accessibilityLiveRegion="polite">
      <Icon name={t.icon} size={18} color={t.fg} />
      <Text style={[styles.text, { color: t.fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.md, marginBottom: 14, alignItems: 'flex-start' },
  text: { flex: 1, fontSize: 13, lineHeight: 18 },
});
