import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/avatar';
import { Icon, categoryIcon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { ProductCard } from '@/components/product-card';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { useCategories, useProducts } from '@/hooks/use-catalog';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';
import { colors, font, radius, shadow } from '@/theme';

/** Inicio: bienvenida, categorías (CU-12/13) y productos del catálogo (CU-09). */
export function HomeScreen() {
  const { t } = useI18n();
  const { user, isAdmin } = useAuth();
  const insets = useSafeAreaInsets();
  const categories = useCategories();
  const products = useProducts({});
  const firstPage = products.data?.pages[0];
  const items = firstPage?.data.slice(0, 6) ?? [];

  const refreshing = categories.isRefetching || (products.isRefetching && !products.isFetchingNextPage);

  return (
    <View style={styles.flex}>
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandRow}>
          <Logo size={38} />
          <View>
            <Text style={styles.brandName}>Zertica</Text>
            <Text style={styles.brandTag}>Drywall Shop</Text>
          </View>
        </View>
        <Pressable onPress={() => router.navigate('/profile')} accessibilityRole="button" accessibilityLabel={t('tabs.profile')}>
          <Avatar name={user?.fullName ?? '?'} size={40} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              categories.refetch();
              products.refetch();
            }}
            colors={[colors.orange]}
            tintColor={colors.orange}
          />
        }>
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcome}>{t('home.welcome')}</Text>
          <Text style={styles.userName}>{user?.fullName} 👋</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>{t('home.heroEyebrow')}</Text>
          <Text style={styles.heroTitle}>
            {firstPage ? t('home.heroTitle', { count: firstPage.meta.total }) : t('home.heroTitleLoading')}
          </Text>
          <Pressable style={styles.heroBtn} onPress={() => router.navigate('/catalog')} accessibilityRole="button">
            <Text style={styles.heroBtnText}>{t('home.heroCta')} →</Text>
          </Pressable>
          <View style={styles.heroDecor}>
            <Icon name="view-grid-outline" size={110} color="rgba(255,255,255,0.14)" />
          </View>
        </View>

        {isAdmin ? (
          <Pressable style={styles.adminCard} onPress={() => router.push('/admin')} accessibilityRole="button">
            <View style={styles.adminIcon}>
              <Icon name="shield-account-outline" size={22} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminTitle}>{t('home.adminPanel')}</Text>
              <Text style={styles.adminSubtitle}>{t('home.adminPanelSubtitle')}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.textOnDarkMuted} />
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
        {categories.isPending ? (
          <LoadingView />
        ) : categories.isError ? (
          <ErrorView error={categories.error} onRetry={() => categories.refetch()} />
        ) : (
          <View style={styles.categoryGrid}>
            {categories.data.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/category/[id]', params: { id: String(c.id), name: c.name } })}
                style={({ pressed }) => [styles.categoryTile, pressed && { opacity: 0.8 }]}
                accessibilityRole="button">
                  <Icon name={categoryIcon(c.name)} size={26} color={colors.navy} />
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {c.name}
                  </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('home.products')}</Text>
          <Text style={styles.seeAll} onPress={() => router.navigate('/catalog')} accessibilityRole="link">
            {t('common.seeAll')}
          </Text>
        </View>
        {products.isPending ? (
          <LoadingView />
        ) : products.isError ? (
          <ErrorView error={products.error} onRetry={() => products.refetch()} />
        ) : items.length === 0 ? (
          <EmptyView title={t('catalog.emptyTitle')} />
        ) : (
          <View style={styles.productGrid}>
            {items.map((p) => (
              <View key={p.id} style={styles.productCell}>
                <ProductCard product={p} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  topBar: {
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { color: colors.white, fontWeight: font.heavy, fontSize: 16 },
  brandTag: { color: colors.textOnDarkMuted, fontSize: 11 },
  scroll: { paddingBottom: 32 },
  welcomeBlock: { backgroundColor: colors.navy, paddingHorizontal: 16, paddingBottom: 60, paddingTop: 6 },
  welcome: { color: colors.textOnDarkMuted, fontSize: 13 },
  userName: { color: colors.white, fontSize: 22, fontWeight: font.heavy, marginTop: 2 },
  hero: {
    marginHorizontal: 16,
    marginTop: -46,
    backgroundColor: colors.orange,
    borderRadius: radius.xl,
    padding: 18,
    overflow: 'hidden',
    ...shadow.raised,
  },
  heroEyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: font.semibold },
  heroTitle: { color: colors.white, fontSize: 20, fontWeight: font.heavy, marginTop: 4, maxWidth: '78%', lineHeight: 26 },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginTop: 14,
  },
  heroBtnText: { color: colors.orangeDark, fontWeight: font.heavy, fontSize: 13 },
  heroDecor: { position: 'absolute', right: -14, bottom: -18 },
  adminCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.navy700,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTitle: { color: colors.white, fontWeight: font.bold, fontSize: 15 },
  adminSubtitle: { color: colors.textOnDarkMuted, fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: font.heavy, color: colors.navy, marginTop: 22, marginBottom: 12, marginHorizontal: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingRight: 16 },
  seeAll: { color: colors.orange, fontWeight: font.bold, fontSize: 13 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: '2.66%', paddingHorizontal: 16 },
  categoryTile: {
    width: '23%',
    aspectRatio: 0.95,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 6,
    ...shadow.card,
  },
  categoryName: { fontSize: 11, fontWeight: font.semibold, color: colors.text, textAlign: 'center' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, rowGap: 12, justifyContent: 'space-between' },
  productCell: { width: '48.3%' },
});
