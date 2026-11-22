import { Tabs } from 'expo-router/js-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emojiTabIcon, tabBarOptions } from '@/components/tab-bar';
import { useI18n } from '@/i18n';

/** Barra inferior del usuario: Inicio, Catálogo, Buscar y Perfil. */
export default function TabsLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{ ...tabBarOptions(insets.bottom), tabBarHideOnKeyboard: Platform.OS === 'android' }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: emojiTabIcon('🏠') }} />
      <Tabs.Screen name="catalog" options={{ title: t('tabs.catalog'), tabBarIcon: emojiTabIcon('📦') }} />
      <Tabs.Screen name="search" options={{ title: t('tabs.search'), tabBarIcon: emojiTabIcon('🔍') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: emojiTabIcon('👤') }} />
    </Tabs>
  );
}
