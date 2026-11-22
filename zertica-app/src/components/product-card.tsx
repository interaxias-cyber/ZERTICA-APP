import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@/api/types';
import { colors, font, radius, shadow } from '@/theme';
import { ProductImage } from './product-image';

export function ProductCard({ product }: { product: Product }) {
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
            {product.category.name}
          </Text>
          <View style={styles.refRow}>
            <Text style={styles.reference} numberOfLines={1}>
              {product.reference}
            </Text>
          </View>
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand.name}
          </Text>
        </View>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 10,
    ...shadow.card,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  image: { width: '100%', aspectRatio: 1.25, borderRadius: radius.md },
  body: { paddingTop: 10, paddingHorizontal: 2, gap: 2 },
  name: { fontSize: 14, fontWeight: font.bold, color: colors.text, minHeight: 36 },
  category: { fontSize: 12, color: colors.textMuted },
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
  brand: { fontSize: 12, color: colors.navy700, fontWeight: font.semibold, marginTop: 6 },
});
