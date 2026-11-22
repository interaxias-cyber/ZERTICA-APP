/**
 * Tokens visuales de Zertica – Drywall Shop.
 * Colores tomados de la presentación del proyecto (logo y maquetas):
 * azul marino (principal), naranja (acento), blanco y gris claro.
 */
export const colors = {
  // Valores tomados del diseño de Figma (24 pantallas).
  navy: '#0F2044',
  navy800: '#1A3060',
  navy700: '#24407A',
  navy100: '#E6EAF2',
  orange: '#F5811E',
  orangeDark: '#DC6D0C',
  orange100: '#FDF0E6',
  white: '#FFFFFF',
  background: '#F0F0F0',
  surface: '#FFFFFF',
  field: '#FFFFFF',
  chip: '#F3F4F6',
  border: '#E5E7EB',
  divider: '#ECEEF2',
  text: '#0F2044',
  textBody: '#374151',
  textMuted: '#6B7280',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#A8B3C8',
  success: '#065F46',
  successBg: '#D1FAE5',
  warning: '#92400E',
  warningBg: '#FEF3C7',
  danger: '#B91C1C',
  dangerSolid: '#EF4444',
  dangerBg: '#FEE2E2',
  info: '#1D4ED8',
  infoBg: '#DBEAFE',
  overlay: 'rgba(15, 32, 68, 0.45)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 8, md: 14, lg: 16, xl: 22, pill: 999 } as const;

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
    boxShadow: '0px 2px 8px rgba(15, 32, 68, 0.06)',
  },
  raised: {
    boxShadow: '0px 8px 20px rgba(245, 129, 30, 0.25)',
  },
} as const;
