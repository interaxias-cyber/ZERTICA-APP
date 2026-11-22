'use strict';

/** Redondeo a 2 decimales para importes. */
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Descuentos por volumen del rol Empresa (pantalla "Pedido masivo" de Figma):
 * +50 u. → 5 %, +100 u. → 10 %, +500 u. → 18 %.
 */
const VOLUME_TIERS = [
  { minQuantity: 500, percent: 18 },
  { minQuantity: 100, percent: 10 },
  { minQuantity: 50, percent: 5 },
];

function volumeDiscountPercent(totalQuantity) {
  const tier = VOLUME_TIERS.find((t) => totalQuantity >= t.minQuantity);
  return tier ? tier.percent : 0;
}

module.exports = { round2, VOLUME_TIERS, volumeDiscountPercent };
