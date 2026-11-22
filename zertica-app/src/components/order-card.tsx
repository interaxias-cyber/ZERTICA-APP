import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Order } from '@/api/types';
import { useI18n } from '@/i18n';
import { money, shortDate } from '@/lib/format';
import { orderTone } from '@/lib/status';
import { colors, font, radius, shadow } from '@/theme';
import { Tag } from './status-badge';

interface Props {
  order: Order;
  onPress: () => void;
  /** Panel: muestra el cliente y acciones propias. */
  showCustomer?: boolean;
  actions?: ReactNode;
}

/** Tarjeta de pedido de "Mis Pedidos" y "Pedidos" del panel (Figma). */
export function OrderCard({ order, onPress, showCustomer, actions }: Props) {
  const { t, language } = useI18n();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]} accessibilityRole="button" accessibilityLabel={order.code}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.code}>#{order.code}</Text>
          <Text style={styles.meta}>
            {showCustomer ? `${order.company?.name ?? order.customer.fullName} · ` : ''}
            {shortDate(order.createdAt, language, !showCustomer)}
          </Text>
        </View>
        <Tag tone={orderTone[order.status]} label={t(`orderStatus.${order.status}`)} />
      </View>
      <View style={styles.divider} />
      {actions ? (
        <View style={styles.bottomRow}>
          <Text style={styles.total}>{money(order.total, language)}</Text>
          <View style={styles.actions}>{actions}</View>
        </View>
      ) : (
        <>
          <View style={styles.bottomRow}>
            <Text style={styles.meta}>{t('orders.articles', { count: order.itemCount })}</Text>
            <Text style={styles.total}>{money(order.total, language)}</Text>
          </View>
          <View style={styles.detailBtn}>
            <Text style={styles.detailText}>{t('orders.viewDetail')}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, ...shadow.card },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  code: { fontSize: 18, fontWeight: font.heavy, color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  total: { fontSize: 18, fontWeight: font.heavy, color: colors.orange },
  actions: { flexDirection: 'row', gap: 8 },
  detailBtn: { marginTop: 14, backgroundColor: colors.chip, borderRadius: radius.md, height: 42, alignItems: 'center', justifyContent: 'center' },
  detailText: { fontSize: 15, fontWeight: font.bold, color: colors.text },
});
