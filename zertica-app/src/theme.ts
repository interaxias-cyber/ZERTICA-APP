/**
 * Tokens visuales de Zertica – Drywall Shop.
 * Colores tomados de la presentación del proyecto (logo y maquetas):
 * azul marino (principal), naranja (acento), blanco y gris claro.
 */
export const colors = {
  navy: '#081B39',
  navy800: '#0F2649',
  navy700: '#1B3561',
  navy100: '#E6EBF3',
  orange: '#F08F2B',
  orangeDark: '#D97814',
  orange100: '#FDEEDC',
  white: '#FFFFFF',
  background: '#F3F4F6',
  surface: '#FFFFFF',
  field: '#FFFFFF',
  border: '#E3E6EB',
  divider: '#ECEEF2',
  text: '#0B1A33',
  textMuted: '#6B7588',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#A9B4C7',
  success: '#1F9D55',
  successBg: '#E3F6EB',
  danger: '#D64545',
  dangerBg: '#FCE8E8',
  overlay: 'rgba(8, 27, 57, 0.45)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const font = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const type = {
  display: { fontSize: 28, fontWeight: font.heavy, color: colors.text, letterSpacing: -0.3 },
  title: { fontSize: 22, fontWeight: font.heavy, color: colors.text },
  heading: { fontSize: 17, fontWeight: font.bold, color: colors.text },
  body: { fontSize: 15, fontWeight: font.regular, color: colors.text },
  label: { fontSize: 13, fontWeight: font.semibold, color: colors.textMuted },
  caption: { fontSize: 12, fontWeight: font.regular, color: colors.textMuted },
} as const;

export const shadow = {
  card: {
    boxShadow: '0px 2px 10px rgba(8, 27, 57, 0.08)',
  },
  raised: {
    boxShadow: '0px 6px 18px rgba(8, 27, 57, 0.16)',
  },
} as const;
