import type { Language } from '@/api/types';

export type TermsDocId = 'service' | 'privacy' | 'cookies' | 'returns';

interface TermsDoc {
  id: TermsDocId;
  emoji: string;
  updated: string;
  title: Record<Language, string>;
  body: Record<Language, string[]>;
}

/**
 * Textos de la pantalla "Términos y privacidad" de Figma.
 * Son textos de ejemplo del proyecto académico: deben revisarse con un asesor
 * legal antes de publicar la aplicación.
 */
export const TERMS: TermsDoc[] = [
  {
    id: 'service',
    emoji: '📜',
    updated: '2026-09-01',
    title: { es: 'Términos de servicio', en: 'Terms of service' },
    body: {
      es: [
        'Zertica – Drywall Shop es una aplicación para consultar el catálogo de materiales de construcción en seco y realizar pedidos.',
        'Para usarla debes crear una cuenta con datos verídicos y mantener la confidencialidad de tu contraseña. Las cuentas pueden desactivarse si se usan de forma indebida.',
        'Los precios y existencias se muestran en tiempo real y pueden cambiar. El pedido se confirma cuando el sistema lo registra y descuenta las existencias.',
        'Las cuentas empresariales tienen crédito, descuentos por volumen y facturación según las condiciones pactadas con su asesor comercial.',
      ],
      en: [
        'Zertica – Drywall Shop is an app to browse the drywall materials catalog and place orders.',
        'To use it you must create an account with truthful data and keep your password confidential. Accounts may be deactivated if misused.',
        'Prices and stock are shown in real time and may change. The order is confirmed when the system registers it and deducts the stock.',
        'Business accounts have credit, volume discounts and invoicing according to the terms agreed with their sales advisor.',
      ],
    },
  },
  {
    id: 'privacy',
    emoji: '🔐',
    updated: '2026-09-01',
    title: { es: 'Política de privacidad', en: 'Privacy policy' },
    body: {
      es: [
        'Tratamos tu nombre, usuario, correo, teléfono, direcciones e historial de pedidos para prestarte el servicio.',
        'Las contraseñas se guardan cifradas (bcrypt). De las tarjetas solo guardamos la marca y los últimos 4 dígitos; nunca el número completo ni el CVV.',
        'No compartimos tus datos con terceros salvo obligación legal o para entregar tus pedidos.',
        'Puedes consultar y actualizar tus datos en Mi Perfil, y solicitar la eliminación de tu cuenta desde esta pantalla.',
      ],
      en: [
        'We process your name, username, email, phone, addresses and order history to provide the service.',
        'Passwords are stored hashed (bcrypt). For cards we only store the brand and last 4 digits; never the full number or CVV.',
        'We do not share your data with third parties except when legally required or to deliver your orders.',
        'You can review and update your data in My Profile, and request account deletion from this screen.',
      ],
    },
  },
  {
    id: 'cookies',
    emoji: '🍪',
    updated: '2026-09-01',
    title: { es: 'Política de cookies', en: 'Cookie policy' },
    body: {
      es: [
        'La aplicación móvil no usa cookies de publicidad. Guarda en el almacenamiento seguro del teléfono tu sesión y el idioma elegido.',
        'Al cerrar sesión se elimina el token de acceso del dispositivo.',
      ],
      en: [
        'The mobile app does not use advertising cookies. It stores your session and chosen language in the phone’s secure storage.',
        'Signing out removes the access token from the device.',
      ],
    },
  },
  {
    id: 'returns',
    emoji: '↩️',
    updated: '2026-09-01',
    title: { es: 'Política de devoluciones', en: 'Returns policy' },
    body: {
      es: [
        'Aplica en compras nacionales. Puedes solicitar la devolución dentro de los 15 días siguientes a la entrega.',
        'El material debe estar sin usar, en su empaque original y con el número de pedido.',
        'No se aceptan devoluciones de material cortado a medida o con daños causados por mal almacenamiento.',
        'Solicítala desde Ayuda y soporte. El reembolso se hace por el mismo medio de pago o como saldo a favor.',
      ],
      en: [
        'Applies to domestic purchases. You can request a return within 15 days after delivery.',
        'The material must be unused, in its original packaging and with the order number.',
        'Custom-cut material or material damaged by improper storage cannot be returned.',
        'Request it from Help & support. Refunds are made to the same payment method or as store credit.',
      ],
    },
  },
];
