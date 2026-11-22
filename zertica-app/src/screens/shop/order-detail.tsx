import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Order, OrderStatus } from '@/api/types';
import { Button } from '@/components/button';
import { Emoji } from '@/components/emoji';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorView, LoadingView } from '@/components/state-views';
import { Tag } from '@/components/status-badge';
import { useOrderStatus, useAdminOrder } from '@/hooks/use-admin';
import { useCancelOrder, useOrder } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { confirmAction, showMessage } from '@/lib/confirm';
import { money, shortDate } from '@/lib/format';
import { invoiceTone, orderTone } from '@/lib/status';
import { colors, font, radius, shadow } from '@/theme';

const STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'completed'];

/** Detalle del pedido. admin = true: acciones del panel ("Actualizar"). */
export function OrderDetailScreen({ id, admin }: { id: number; admin?: boolean }) {
  const { t } = useI18n();
  const mine = useOrder(admin ? 0 : id);
  const adminQuery = useAdminOrder(admin ? id : 0);
  const query = admin ? adminQuery : mine;
  const order = query.data;

  return (
    <View style={styles.flex}>
      <ScreenHeader title={order ? t('orders.detailTitle', { code: order.code }) : t('orders.title')} subtitle={order?.company?.name ?? order?.customer.fullName} back />
      {query.isPending ? (
        <LoadingView />
      ) : query.isError || !order ? (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <OrderBody order={order} admin={admin} />
      )}
    </View>
  );
}

function OrderBody({ order, admin }: { order: Order; admin?: boolean }) {
  const { t, language, errorMessage } = useI18n();
  const cancel = useCancelOrder();
  const update = useOrderStatus();
  const current = STEPS.indexOf(order.status);

  const onCancel = async () => {
    const ok = await confirmAction(t('orders.cancelTitle'), t('orders.cancelBody', { code: order.code }), t('common.yes'), t('common.no'), true);
    if (!ok) return;
    try {
      await cancel.mutateAsync(order.id);
      showMessage(t('orders.cancelled'));
    } catch (err) {
      showMessage(t('orders.cancelTitle'), errorMessage(err));
    }
  };

  const onUpdate = async (status: OrderStatus) => {
    const ok = await confirmAction(t('adminOrders.updateTitle', { code: order.code }), t(`adminOrders.toStatus_${status}` as 'adminOrders.toStatus_shipped'), t('common.confirm'), t('common.cancel'), status === 'cancelled');
    if (!ok) return;
    try {
      await update.mutateAsync({ id: order.id, status });
      showMessage(t('adminOrders.updated'));
    } catch (err) {
      showMessage(t('adminOrders.update'), errorMessage(err));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.card}>
        <View style={styles.headRow}>
          <View>
            <Text style={styles.code}>#{order.code}</Text>
            <Text style={styles.muted}>{t('orders.placedOn', { date: shortDate(order.createdAt, language) })}</Text>
          </View>
          <Tag tone={orderTone[order.status]} label={t(`orderStatus.${order.status}`)} />
        </View>
        {order.status !== 'cancelled' ? (
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={s} style={styles.step}>
                <View style={[styles.dot, i <= current && styles.dotOn]} />
                <Text style={[styles.stepLabel, i <= current && styles.stepOn]} numberOfLines={1}>
                  {t(`orderStatus.${s}`)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('orders.items')}</Text>
        {order.items?.map((it) => (
          <View key={`${it.productId}-${it.reference}`} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{it.name}</Text>
              <Text style={styles.muted}>
                {it.reference} · {it.quantity} × {money(it.unitPrice, language)}
              </Text>
            </View>
            <Text style={styles.itemTotal}>{money(it.lineTotal, language)}</Text>
          </View>
        ))}
        <View style={styles.sep} />
        <Row label={t('cart.subtotal')} value={money(order.subtotal, language)} />
        {order.discount > 0 ? <Row label={t('cart.discount', { percent: order.discountPercent })} value={`-${money(order.discount, language)}`} /> : null}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('cart.total')}</Text>
          <Text style={styles.total}>{money(order.total, language)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Info emoji="📍" label={t('orders.shipping')} value={order.shippingAddress} />
        <Info emoji="💳" label={t('orders.payment')} value={order.paymentLabel} />
        {admin ? <Info emoji="👤" label={t('orders.customer')} value={`${order.customer.fullName} (@${order.customer.username})`} /> : null}
        {order.invoice ? (
          <View style={styles.infoRow}>
            <Emoji char="📄" size={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.muted}>{t('orders.invoice')}</Text>
              <Text style={styles.infoValue}>{order.invoice.code}</Text>
            </View>
            <Tag tone={invoiceTone[order.invoice.status]} label={t(`invoiceStatus.${order.invoice.status}`)} />
          </View>
        ) : null}
        {order.notes ? <Info emoji="📝" label={t('orders.notes')} value={order.notes} /> : null}
      </View>

      {admin
        ? order.allowedTransitions.map((s) => (
            <Button
              key={s}
              title={t(`adminOrders.toStatus_${s}` as 'adminOrders.toStatus_shipped')}
              variant={s === 'cancelled' ? 'danger' : 'primary'}
              loading={update.isPending}
              onPress={() => onUpdate(s)}
              testID={`to-${s}`}
            />
          ))
        : ['pending', 'processing'].includes(order.status) ? (
            <Button title={t('orders.cancel')} variant="danger" onPress={onCancel} loading={cancel.isPending} testID="order-cancel" />
          ) : null}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Info({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Emoji char={emoji} size={20} />
      <View style={{ flex: 1 }}>
        <Text style={styles.muted}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 10, ...shadow.card },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  code: { fontSize: 20, fontWeight: font.heavy, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  steps: { flexDirection: 'row', marginTop: 8 },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border },
  dotOn: { backgroundColor: colors.orange },
  stepLabel: { fontSize: 11, color: colors.textMuted },
  stepOn: { color: colors.text, fontWeight: font.semibold },
  title: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemName: { fontSize: 15, fontWeight: font.semibold, color: colors.text },
  itemTotal: { fontSize: 15, fontWeight: font.bold, color: colors.text },
  sep: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowValue: { fontSize: 14, fontWeight: font.semibold, color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  total: { fontSize: 22, fontWeight: font.heavy, color: colors.orange },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: font.medium },
});
