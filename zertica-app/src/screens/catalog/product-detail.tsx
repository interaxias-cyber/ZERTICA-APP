import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { Icon } from '@/components/icon';
import { ProductImage } from '@/components/product-image';
import { ScreenHeader } from '@/components/screen-header';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Button } from '@/components/button';
import { QuantityStepper } from '@/components/quantity-stepper';
import { useProduct } from '@/hooks/use-catalog';
import { useCartMutations } from '@/hooks/use-commerce';
import { money } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { useI18n } from '@/i18n';
import { colors, font, radius, shadow } from '@/theme';

/** CU-14 Ver detalle + CU-15 características. Sin precio ni stock (fuera del MVP). */
export function ProductDetailScreen({ id }: { id: number }) {
  const { t, language, errorMessage } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const { add } = useCartMutations();
  const [quantity, setQuantity] = useState(1);
  const query = useProduct(id);
  const product = query.data;
  const canBuy = user?.role === 'user' || user?.role === 'company';

  let content: React.ReactNode;
  if (query.isPending) content = <LoadingView />;
  else if (query.isError) {
    content =
      query.error instanceof ApiError && query.error.status === 404 ? (
        <EmptyView icon="package-variant-remove" title={t('product.notFound')} />
      ) : (
        <ErrorView error={query.error} onRetry={() => query.refetch()} />
      );
  } else if (product) {
    content = (
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.imageCard}>
          <ProductImage
            uri={product.imageUrl}
            categoryName={product.category.name}
            style={styles.image}
            iconSize={64}
            label={product.imageUrl ? undefined : t('product.noImage')}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.tagsRow}>
            <Text style={styles.reference}>{product.reference}</Text>
          </View>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.metaGrid}>
            <Meta icon="tag-outline" label={t('common.brand')} value={product.brand.name} />
            <Meta icon="shape-outline" label={t('common.category')} value={product.category.name} />
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{money(product.price, language)}</Text>
            <Text style={[styles.stock, product.stock <= 0 && styles.out]}>
              {product.stock > 0 ? t('cart.stock', { count: product.stock }) : t('cart.outOfStock')}
            </Text>
          </View>
          {canBuy && product.stock > 0 ? (
            <View style={styles.buyRow}>
              <QuantityStepper value={quantity} onChange={setQuantity} max={product.stock} label={t('cart.quantity')} />
              <Button
                title={t('cart.addToCart')}
                style={{ flex: 1 }}
                loading={add.isPending}
                testID="detail-add"
                onPress={() =>
                  add.mutate(
                    { productId: product.id, quantity },
                    { onSuccess: () => toast(t('cart.added')), onError: (err) => toast(errorMessage(err), 'error') },
                  )
                }
              />
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('product.description')}</Text>
          <Text style={styles.description}>{product.description || t('product.noDescription')}</Text>
        </View>

        {product.features.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('product.features')}</Text>
            {product.features.map((f, i) => (
              <View key={f.id} style={[styles.featureRow, i < product.features.length - 1 && styles.featureDivider]}>
                <Text style={styles.featureName}>{f.name}</Text>
                <Text style={styles.featureValue}>{f.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader title={product?.name ?? t('product.title')} subtitle={product?.category.name} back />
      {content}
    </View>
  );
}

function Meta({ icon, label, value }: { icon: 'tag-outline' | 'shape-outline'; label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <View style={styles.metaIcon}>
        <Icon name={icon} size={18} color={colors.orange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  imageCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 10, ...shadow.card },
  image: { width: '100%', aspectRatio: 1.3, borderRadius: radius.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow.card },
  tagsRow: { flexDirection: 'row', marginBottom: 8 },
  reference: {
    fontSize: 12,
    fontWeight: font.heavy,
    color: colors.orangeDark,
    backgroundColor: colors.orange100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    letterSpacing: 0.4,
  },
  name: { fontSize: 21, fontWeight: font.heavy, color: colors.text, lineHeight: 27 },
  metaGrid: { flexDirection: 'row', gap: 12, marginTop: 16 },
  meta: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.orange100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: { fontSize: 11, color: colors.textMuted },
  metaValue: { fontSize: 14, fontWeight: font.bold, color: colors.navy },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  price: { fontSize: 26, fontWeight: font.heavy, color: colors.orange },
  stock: { fontSize: 14, color: colors.textMuted },
  out: { color: colors.danger, fontWeight: font.semibold },
  buyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  sectionTitle: { fontSize: 15, fontWeight: font.heavy, color: colors.navy, marginBottom: 8 },
  description: { fontSize: 14, color: colors.textBody, lineHeight: 21 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, gap: 12 },
  featureDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  featureName: { fontSize: 14, color: colors.textMuted },
  featureValue: { fontSize: 14, fontWeight: font.bold, color: colors.text, textAlign: 'right', flexShrink: 1 },
});
