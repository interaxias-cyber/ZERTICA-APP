import * as SplashScreen from 'expo-splash-screen';
import { router, useSegments } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { setApiUrlOverride } from '@/config/env';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider, useI18n } from '@/i18n';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { status, landing } = useAuth();
  const { hasChosenLanguage } = useI18n();
  const ready = status !== 'loading' && hasChosenLanguage !== null;

  const segments = useSegments();
  const signedIn = status === 'signedIn';
  const area = segments[0] as string | undefined;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Lleva al usuario a la zona que le corresponde cuando cambia la sesión o el idioma.
  // Estado anterior: solo un inicio de sesión explícito (signedOut → signedIn) fuerza
  // la pantalla de destino; restaurar la sesión al abrir la app respeta la ruta actual.
  const prevStatus = useRef(status);

  useEffect(() => {
    if (!ready) return;
    const justSignedIn = signedIn && prevStatus.current === 'signedOut';
    prevStatus.current = status;
    if (signedIn) {
      // Tras iniciar sesión: catálogo, o panel si se entró por el acceso administrativo.
      // Se difiere un ciclo para que la guarda de navegación termine su propia redirección.
      if (justSignedIn) {
        const id = setTimeout(() => router.replace(landing), 0);
        return () => clearTimeout(id);
      }
      if (area !== '(app)') router.replace(landing);
    } else if (!hasChosenLanguage) {
      if (area !== 'language') router.replace('/language');
    } else if (area !== '(auth)') {
      router.replace('/login');
    }
  }, [ready, status, signedIn, hasChosenLanguage, area, landing]);

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
  // Carga la dirección del servidor configurada en el teléfono antes de la primera petición.
  const [serverLoaded, setServerLoaded] = useState(false);
  useEffect(() => {
    storage
      .get(STORAGE_KEYS.apiUrl)
      .then((url) => setApiUrlOverride(url))
      .catch(() => {})
      .finally(() => setServerLoaded(true));
  }, []);
  if (!serverLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <I18nProvider>
            <AuthProvider>
              <ToastProvider>
                <StatusBar style="light" />
                <RootNavigator />
              </ToastProvider>
            </AuthProvider>
          </I18nProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
