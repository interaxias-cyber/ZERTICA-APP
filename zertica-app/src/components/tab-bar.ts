import type { ColorValue } from 'react-native';
import { colors } from '@/theme';
import { createElement } from 'react';
import { Emoji } from './emoji';

/** Estilo de la barra inferior del diseño de Figma: fondo azul marino, activo en naranja. */
export function tabBarOptions(bottomInset: number) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.orange,
    tabBarInactiveTintColor: colors.textOnDarkMuted,
    tabBarStyle: {
      backgroundColor: colors.navy,
      borderTopWidth: 0,
      height: 70 + bottomInset,
      paddingBottom: Math.max(bottomInset, 10),
      paddingTop: 8,
    },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  };
}

export function emojiTabIcon(char: string) {
  function TabIcon({ focused }: { focused: boolean; color: ColorValue }) {
    return createElement(Emoji, { char, size: 22, dim: !focused });
  }
  return TabIcon;
}
