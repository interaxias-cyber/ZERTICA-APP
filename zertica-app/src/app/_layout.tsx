import * as SplashScreen from 'expo-splash-screen';
import { router, useSegments } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider, useI18n } from '@/i18n';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { status } = useAuth();
  const { hasChosenLanguage } = useI18n();
  const ready = status !== 'loading' && hasChosenLanguage !== null;

  const segments = useSegments();
  const signedIn = status === 'signedIn';
  const area = segments[0] as string | undefined;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Lleva al usuario a la zona que le corresponde cuando cambia la sesión o el idioma.
  useEffect(() => {
    if (!ready) return;
    if (signedIn) {
      if (area !== '(app)') router.replace('/');
    } else if (!hasChosenLanguage) {
      if (area !== 'language') router.replace('/language');
    } else if (area !== '(auth)') {
      router.replace('/login');
    }
  }, [ready, signedIn, hasChosenLanguage, area]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
      {/* Diagrama de actividades: primero se elige el idioma, luego inicio de sesión. */}
      <Stack.Protected guard={!signedIn && !hasChosenLanguage}>
        <Stack.Screen name="language" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn && !!hasChosenLanguage}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      {/* RN01: solo usuarios autenticados y activos acceden al catálogo. */}
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <I18nProvider>
            <AuthProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </AuthProvider>
          </I18nProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
