import { Tabs } from 'expo-router/js-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emojiTabIcon, tabBarOptions } from '@/components/tab-bar';
import { useCart } from '@/hooks/use-commerce';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

/** Barra inferior del usuario (Figma): Inicio, Catálogo, Carrito, Pedidos, Perfil. */
export default function TabsLayout() {
  const { t } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const canBuy = user?.role === 'user' || user?.role === 'company';
  const cart = useCart(canBuy);
  const count = cart.data?.itemCount ?? 0;
  return (
    <Tabs screenOptions={{ ...tabBarOptions(insets.bottom), tabBarHideOnKeyboard: Platform.OS === 'android' }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: emojiTabIcon('🏠') }} />
      <Tabs.Screen name="catalog" options={{ title: t('tabs.catalog'), tabBarIcon: emojiTabIcon('📦') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('tabs.cart'),
          tabBarIcon: emojiTabIcon('🛒'),
          tabBarBadge: count > 0 ? (count > 99 ? '99+' : count) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.orange, color: colors.white, fontSize: 11 },
          href: canBuy ? undefined : null,
        }}
      />
      <Tabs.Screen name="orders" options={{ title: t('tabs.orders'), tabBarIcon: emojiTabIcon('📋'), href: canBuy ? undefined : null }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: emojiTabIcon('👤') }} />
    </Tabs>
  );
}
