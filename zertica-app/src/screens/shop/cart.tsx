import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Emoji } from '@/components/emoji';
import { Icon } from '@/components/icon';
import { ProductImage } from '@/components/product-image';
import { QuantityStepper } from '@/components/quantity-stepper';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorView, LoadingView } from '@/components/state-views';
import { useCart, useCartMutations } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { money } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { colors, font, radius, shadow } from '@/theme';

/** Pantalla "Mi Carrito" de Figma. */
export function CartScreen() {
  const { t, language, errorMessage } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const cart = useCart();
  const { setQuantity, remove } = useCartMutations();
  const data = cart.data;
  const count = data?.itemCount ?? 0;

  const header = (
    <ScreenHeader
      title={t('cart.title')}
      subtitle={count === 1 ? t('cart.item') : t('cart.items', { count })}
      leading="logo"
      right={<Avatar name={user?.fullName ?? '?'} size={40} shape="rounded" />}
    />
  );

  if (cart.isPending) {
    return (
      <View style={styles.flex}>
        {header}
        <LoadingView />
      </View>
    );
  }
  if (cart.isError || !data) {
    return (
      <View style={styles.flex}>
        {header}
        <ErrorView error={cart.error} onRetry={() => cart.refetch()} />
      </View>
    );
  }

  const blocked = data.items.some((i) => !i.available || !i.enoughStock);

  return (
    <View style={styles.flex}>
      {header}
      <FlatList
        data={data.items}
        keyExtractor={(i) => String(i.product.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={cart.isRefetching} onRefresh={() => void cart.refetch()} colors={[colors.orange]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Emoji char="🛒" size={72} />
            <Text style={styles.emptyTitle}>{t('cart.emptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('cart.emptyBody')}</Text>
            <Button title={t('cart.goCatalog')} variant="secondary" onPress={() => router.navigate('/catalog')} style={{ marginTop: 18, paddingHorizontal: 28 }} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable onPress={() => router.push({ pathname: '/product/[id]', params: { id: String(item.product.id) } })}>
              <ProductImage uri={item.product.imageUrl} categoryName={item.product.category.name} style={styles.thumb} iconSize={22} />
            </Pressable>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.meta}>
                {money(item.product.price, language)}
                {t('cart.perUnit')} · {item.product.reference}
              </Text>
              {!item.available ? (
                <Text style={styles.warn}>{t('cart.unavailable')}</Text>
              ) : !item.enoughStock ? (
                <Text style={styles.warn}>{t('cart.stockLeft', { count: item.product.stock })}</Text>
              ) : null}
              <View style={styles.rowBottom}>
                <QuantityStepper
                  value={item.quantity}
                  max={Math.max(item.product.stock, 1)}
                  label={t('cart.quantity')}
                  onChange={(q) => setQuantity.mutate({ productId: item.product.id, quantity: q }, { onError: (e) => toast(errorMessage(e), 'error') })}
                />
                <Text style={styles.lineTotal}>{money(item.lineTotal, language)}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => remove.mutate(item.product.id)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`${t('cart.remove')} ${item.product.name}`}
              style={styles.remove}>
              <Icon name="close" size={18} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />
      {data.items.length > 0 ? (
        <View style={styles.summary}>
          <Line label={t('cart.subtotal')} value={money(data.subtotal, language)} />
          {data.discount > 0 ? <Line label={t('cart.discount', { percent: data.discountPercent })} value={`-${money(data.discount, language)}`} green /> : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('cart.total')}</Text>
            <Text style={styles.totalValue}>{money(data.total, language)}</Text>
          </View>
          <Button title={t('cart.checkout')} disabled={blocked} onPress={() => router.push('/checkout')} testID="cart-checkout" />
        </View>
      ) : null}
    </View>
  );
}

function Line({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={[styles.lineValue, green && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 22, fontWeight: font.heavy, color: colors.text, marginTop: 16 },
  emptyBody: { fontSize: 15, color: colors.textMuted, marginTop: 6 },
  row: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, ...shadow.card },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  name: { fontSize: 15, fontWeight: font.bold, color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
  warn: { fontSize: 12, color: colors.danger, fontWeight: font.semibold },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  lineTotal: { fontSize: 16, fontWeight: font.heavy, color: colors.orange },
  remove: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' },
  summary: { backgroundColor: colors.surface, padding: 16, gap: 8, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, ...shadow.card },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
  lineLabel: { fontSize: 14, color: colors.textMuted },
  lineValue: { fontSize: 14, color: colors.text, fontWeight: font.semibold },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  totalLabel: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  totalValue: { fontSize: 22, fontWeight: font.heavy, color: colors.orange },
});
