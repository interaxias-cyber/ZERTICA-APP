import { Tabs } from 'expo-router/js-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emojiTabIcon, tabBarOptions } from '@/components/tab-bar';
import { useI18n } from '@/i18n';

/** Barra inferior del panel administrativo (Figma), limitada al alcance del MVP. */
export default function AdminTabsLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{ ...tabBarOptions(insets.bottom), tabBarHideOnKeyboard: Platform.OS === 'android' }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.summary'), tabBarIcon: emojiTabIcon('📊') }} />
      <Tabs.Screen name="products" options={{ title: t('tabs.products'), tabBarIcon: emojiTabIcon('📦') }} />
      <Tabs.Screen name="categories" options={{ title: t('tabs.categories'), tabBarIcon: emojiTabIcon('🗂️') }} />
      <Tabs.Screen name="users" options={{ title: t('tabs.users'), tabBarIcon: emojiTabIcon('👥') }} />
      <Tabs.Screen name="account" options={{ title: t('tabs.account'), tabBarIcon: emojiTabIcon('🛡️') }} />
    </Tabs>
  );
}
