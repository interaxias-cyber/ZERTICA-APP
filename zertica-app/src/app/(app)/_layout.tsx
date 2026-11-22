import { Stack } from 'expo-router/stack';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  const { isAdmin, user } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="category/[id]" />
      <Stack.Screen name="profile-edit" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="language-settings" />
      <Stack.Screen name="search" />
      <Stack.Screen name="orders/[id]" />
      <Stack.Screen name="orders-history" />
      <Stack.Screen name="addresses/index" />
      <Stack.Screen name="addresses/[id]" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="help" />
      <Stack.Screen name="terms/index" />
      <Stack.Screen name="terms/[doc]" />
      {/* Compra: solo clientes (usuario y empresa). */}
      <Stack.Protected guard={user?.role === 'user' || user?.role === 'company'}>
        <Stack.Screen name="checkout" />
      </Stack.Protected>
      {/* Portal Empresa: solo rol company. */}
      <Stack.Protected guard={user?.role === 'company'}>
        <Stack.Screen name="company" />
      </Stack.Protected>
      {/* RN06: los módulos administrativos solo existen para el rol admin. */}
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen name="admin" />
      </Stack.Protected>
    </Stack>
  );
}
