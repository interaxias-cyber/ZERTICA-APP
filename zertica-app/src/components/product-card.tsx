import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@/api/types';
import { useCartMutations } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { money } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { colors, font, radius, shadow } from '@/theme';
import { ProductImage } from './product-image';

/** Tarjeta del catálogo (Figma): imagen, nombre, categoría, stock, precio y "+" para agregar al carrito. */
export function ProductCard({ product }: { product: Product }) {
  const { t, language, errorMessage } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const { add } = useCartMutations();
  const canBuy = user?.role === 'user' || user?.role === 'company';
  const outOfStock = product.stock <= 0;

  const addToCart = () => {
    add.mutate(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => toast(t('cart.added')),
        onError: (err) => toast(errorMessage(err), 'error'),
      },
    );
  };

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: String(product.id) } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.reference}`}>
      <ProductImage uri={product.imageUrl} categoryName={product.category.name} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {product.category.name} · {product.brand.name}
        </Text>
        <View style={styles.refRow}>
          <Text style={styles.reference} numberOfLines={1}>
            {product.reference}
          </Text>
        </View>
        <Text style={[styles.stock, outOfStock && styles.out]}>
          {outOfStock ? t('cart.outOfStock') : t('cart.stock', { count: product.stock })}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{money(product.price, language)}</Text>
          {canBuy ? (
            <Pressable
              onPress={addToCart}
              disabled={outOfStock || add.isPending}
              style={({ pressed }) => [styles.add, (outOfStock || pressed) && { opacity: 0.6 }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`${t('cart.addToCart')}: ${product.name}`}
              testID={`add-${product.id}`}>
              {add.isPending ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.addText}>+</Text>}
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, ...shadow.card },
  pressed: { opacity: 0.9 },
  image: { width: '100%', aspectRatio: 1.5, borderRadius: 10 },
  body: { paddingTop: 10, paddingHorizontal: 2, gap: 2 },
  name: { fontSize: 15, fontWeight: font.bold, color: colors.text, minHeight: 38 },
  category: { fontSize: 13, color: colors.textMuted },
  refRow: { flexDirection: 'row', marginTop: 6 },
  reference: {
    fontSize: 11,
    fontWeight: font.bold,
    color: colors.orangeDark,
    backgroundColor: colors.orange100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  stock: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  out: { color: colors.danger, fontWeight: font.semibold },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price: { fontSize: 19, fontWeight: font.heavy, color: colors.orange },
  add: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.white, fontSize: 22, fontWeight: font.bold, lineHeight: 24 },
});
