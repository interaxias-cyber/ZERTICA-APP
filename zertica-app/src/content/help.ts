import type { Language } from '@/api/types';

/** Preguntas frecuentes (pantalla "Ayuda y soporte" de Figma). */
export const FAQ: Record<Language, { q: string; a: string }[]> = {
  es: [
    {
      q: '¿Cómo realizo un pedido?',
      a: 'Agrega productos al carrito desde el catálogo o el detalle, abre la pestaña Carrito y pulsa "Continuar compra". Elige la dirección de entrega y el método de pago y confirma. Verás el pedido en la pestaña Pedidos.',
    },
    {
      q: '¿Cuánto tarda la entrega?',
      a: 'Los pedidos confirmados se preparan en 1 a 2 días hábiles. La entrega en la ciudad tarda de 1 a 3 días hábiles; el estado del pedido cambia a "Enviado" y luego a "Completado".',
    },
    {
      q: '¿Puedo devolver un producto?',
      a: 'Sí, dentro de los 15 días siguientes a la entrega si el material está sin usar y en su empaque. Escríbenos desde este formulario con el número de pedido. Consulta la Política de devoluciones en Términos y privacidad.',
    },
    {
      q: '¿Cómo rastreo mi pedido?',
      a: 'En Pedidos → "Ver detalle" ves el estado: Pendiente, En proceso, Enviado o Completado. Puedes cancelar un pedido mientras esté Pendiente o En proceso.',
    },
    {
      q: '¿Cómo pago con transferencia?',
      a: 'Elige "Transferencia bancaria" al finalizar la compra. El pedido queda Pendiente hasta que confirmemos el pago. Los datos bancarios están en Métodos de pago → Otras opciones.',
    },
  ],
  en: [
    {
      q: 'How do I place an order?',
      a: 'Add products to the cart from the catalog or the product page, open the Cart tab and tap "Checkout". Choose the delivery address and payment method and confirm. The order appears in the Orders tab.',
    },
    {
      q: 'How long does delivery take?',
      a: 'Confirmed orders are prepared in 1–2 business days. City delivery takes 1–3 business days; the order status changes to "Shipped" and then "Completed".',
    },
    {
      q: 'Can I return a product?',
      a: 'Yes, within 15 days after delivery if the material is unused and in its packaging. Write to us with this form including the order number. See the Returns policy in Terms & privacy.',
    },
    {
      q: 'How do I track my order?',
      a: 'In Orders → "View details" you see the status: Pending, Processing, Shipped or Completed. You can cancel an order while it is Pending or Processing.',
    },
    {
      q: 'How do I pay by bank transfer?',
      a: 'Choose "Bank transfer" at checkout. The order stays Pending until we confirm the payment. Bank details are under Payment methods → Other options.',
    },
  ],
};
