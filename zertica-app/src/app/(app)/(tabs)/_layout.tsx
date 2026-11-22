import { Tabs } from 'expo-router/js-tabs';
import { Platform, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/icon';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

function tabIcon(name: IconName, active: IconName) {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon name={focused ? active : name} size={24} color={color as string} />;
  }
  return TabIcon;
}

/** Barra inferior: Inicio, Catálogo, Búsqueda y Perfil. */
export default function TabsLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: '#8A93A5',
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.divider,
          height: 68 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', lineHeight: 16 },
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen
        name="catalog"
        options={{ title: t('tabs.catalog'), tabBarIcon: tabIcon('package-variant-closed', 'package-variant') }}
      />
      <Tabs.Screen name="search" options={{ title: t('tabs.search'), tabBarIcon: tabIcon('magnify', 'magnify') }} />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('account-outline', 'account') }}
      />
    </Tabs>
  );
}
