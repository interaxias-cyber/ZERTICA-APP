import { Stack } from 'expo-router/stack';
import { colors } from '@/theme';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function CompanyLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }} />;
}
