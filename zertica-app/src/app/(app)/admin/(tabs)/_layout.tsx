import { Tabs } from 'expo-router/js-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emojiTabIcon, tabBarOptions } from '@/components/tab-bar';
import { useI18n } from '@/i18n';

/** Barra inferior del panel (Figma): Dashboard, Productos, Pedidos, Usuarios, Reportes, Mi cuenta. */
export default function AdminTabsLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const base = tabBarOptions(insets.bottom);
  return (
    <Tabs screenOptions={{ ...base, tabBarLabelStyle: { ...base.tabBarLabelStyle, fontSize: 10 }, tabBarItemStyle: { paddingHorizontal: 0 }, tabBarHideOnKeyboard: Platform.OS === 'android' }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.dashboard'), tabBarIcon: emojiTabIcon('📊') }} />
      <Tabs.Screen name="products" options={{ title: t('tabs.products'), tabBarIcon: emojiTabIcon('📦') }} />
      <Tabs.Screen name="orders" options={{ title: t('tabs.orders'), tabBarIcon: emojiTabIcon('📋') }} />
      <Tabs.Screen name="users" options={{ title: t('tabs.users'), tabBarIcon: emojiTabIcon('👥') }} />
      <Tabs.Screen name="reports" options={{ title: t('tabs.reports'), tabBarIcon: emojiTabIcon('📈') }} />
      <Tabs.Screen name="account" options={{ title: t('tabs.account'), tabBarIcon: emojiTabIcon('🛡️') }} />
    </Tabs>
  );
}
