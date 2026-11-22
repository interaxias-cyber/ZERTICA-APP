import { Stack } from 'expo-router/stack';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  const { isAdmin } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="category/[id]" />
      <Stack.Screen name="profile-edit" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="language-settings" />
      {/* RN06: los módulos administrativos solo existen para el rol admin. */}
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen name="admin" />
      </Stack.Protected>
    </Stack>
  );
}
