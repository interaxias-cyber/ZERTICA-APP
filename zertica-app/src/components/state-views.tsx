import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { colors, font } from '@/theme';
import { Button } from './button';
import { Icon, type IconName } from './icon';

export function LoadingView({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.orange} />
      <Text style={styles.muted}>{label ?? t('common.loading')}</Text>
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t, errorMessage } = useI18n();
  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerBg }]}>
        <Icon name="wifi-alert" size={30} color={colors.danger} />
      </View>
      <Text style={styles.body}>{errorMessage(error)}</Text>
      {onRetry ? <Button title={t('common.retry')} icon="refresh" variant="secondary" onPress={onRetry} size="sm" /> : null}
    </View>
  );
}

interface EmptyProps {
  icon?: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyView({ icon = 'package-variant', title, body, actionLabel, onAction }: EmptyProps) {
  return (
    <View style={styles.center}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={30} color={colors.orange} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} variant="outline" size="sm" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, minHeight: 260 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.orange100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: font.bold, color: colors.text, textAlign: 'center' },
  body: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  muted: { color: colors.textMuted, fontSize: 13 },
});
