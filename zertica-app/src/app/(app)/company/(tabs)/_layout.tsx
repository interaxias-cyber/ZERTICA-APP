import { Tabs } from 'expo-router/js-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emojiTabIcon, tabBarOptions } from '@/components/tab-bar';
import { useI18n } from '@/i18n';

/** Barra inferior del portal Empresa (Figma): Empresa, Masivo, Facturas, Contacto, Cuenta. */
export default function CompanyTabsLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{ ...tabBarOptions(insets.bottom), tabBarHideOnKeyboard: Platform.OS === 'android' }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.company'), tabBarIcon: emojiTabIcon('🏢') }} />
      <Tabs.Screen name="bulk" options={{ title: t('tabs.bulk'), tabBarIcon: emojiTabIcon('📦') }} />
      <Tabs.Screen name="invoices" options={{ title: t('tabs.invoices'), tabBarIcon: emojiTabIcon('📄') }} />
      <Tabs.Screen name="contacts" options={{ title: t('tabs.contact'), tabBarIcon: emojiTabIcon('📞') }} />
      <Tabs.Screen name="account" options={{ title: t('tabs.companyAccount'), tabBarIcon: emojiTabIcon('⚙️') }} />
    </Tabs>
  );
}
