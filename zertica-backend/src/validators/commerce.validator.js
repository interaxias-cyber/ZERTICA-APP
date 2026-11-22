'use strict';

const ApiError = require('../utils/ApiError');
const { FieldErrors, str, parsePositiveInt, parseBoolean } = require('./common');

function validateAddress(body, { partial = false } = {}) {
  const e = new FieldErrors();
  const out = {};
  const fields = { label: 50, line1: 200, city: 100 };
  for (const [f, max] of Object.entries(fields)) {
    if (partial && body[f] === undefined) continue;
    const v = str(body[f]);
    if (!v) e.add(f, 'REQUIRED');
    else if (v.length > max) e.add(f, 'TOO_LONG');
    else out[f] = v;
  }
  if (body.postalCode !== undefined) {
    const v = str(body.postalCode);
    if (v.length > 20) e.add('postalCode', 'TOO_LONG');
    else out.postalCode = v || null;
  }
  if (body.isDefault !== undefined) out.isDefault = parseBoolean(body.isDefault, 'isDefault');
  e.throwIfAny();
  return out;
}

function luhn(number) {
  let sum = 0;
  let dbl = false;
  for (let i = number.length - 1; i >= 0; i -= 1) {
    let d = Number(number[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function cardBrand(number) {
  if (/^4/.test(number)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  return 'other';
}

/**
 * Valida una tarjeta. El número completo y el CVV se usan solo para validar:
 * se devuelven marca y últimos 4 dígitos, nunca se almacenan (simulación sin pasarela).
 */
function validateCard(body, now = new Date()) {
  const e = new FieldErrors();
  const number = str(body.number).replace(/[\s-]/g, '');
  const holderName = str(body.holderName);
  const cvv = str(body.cvv);
  const expiry = str(body.expiry); // "MM/AA"
  let expMonth;
  let expYear;
  if (!number) e.add('number', 'REQUIRED');
  else if (!/^\d{13,19}$/.test(number) || !luhn(number)) e.add('number', 'INVALID_CARD');
  const m = /^(\d{2})\s*\/\s*(\d{2}|\d{4})$/.exec(expiry);
  if (!expiry) e.add('expiry', 'REQUIRED');
  else if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) e.add('expiry', 'INVALID_FORMAT');
  else {
    expMonth = Number(m[1]);
    expYear = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
    const endOfMonth = new Date(expYear, expMonth, 1);
    if (endOfMonth <= now) e.add('expiry', 'CARD_EXPIRED');
  }
  if (!cvv) e.add('cvv', 'REQUIRED');
  else if (!/^\d{3,4}$/.test(cvv)) e.add('cvv', 'INVALID_FORMAT');
  if (!holderName) e.add('holderName', 'REQUIRED');
  else if (holderName.length > 120) e.add('holderName', 'TOO_LONG');
  e.throwIfAny();
  return { brand: cardBrand(number), last4: number.slice(-4), expMonth, expYear, holderName: holderName.toUpperCase() };
}

function validateQuantity(value, field = 'quantity') {
  return parsePositiveInt(value, field, { max: 100000 });
}

/** Cuerpo de compra: dirección, medio de pago y líneas opcionales (pedido masivo). */
function validateCheckout(body, { allowItems = false } = {}) {
  const e = new FieldErrors();
  const out = {};
  const addressId = body.addressId;
  if (!addressId || !/^\d+$/.test(String(addressId))) e.add('addressId', 'REQUIRED');
  else out.addressId = Number(addressId);
  const type = str(body.paymentType);
  if (!['card', 'transfer', 'credit'].includes(type)) e.add('paymentType', 'INVALID_PAYMENT');
  else out.paymentType = type;
  if (type === 'card') {
    if (!body.paymentMethodId || !/^\d+$/.test(String(body.paymentMethodId))) e.add('paymentMethodId', 'REQUIRED');
    else out.paymentMethodId = Number(body.paymentMethodId);
  }
  const notes = str(body.notes);
  if (notes.length > 500) e.add('notes', 'TOO_LONG');
  out.notes = notes || null;
  if (allowItems) {
    if (!Array.isArray(body.items) || body.items.length === 0) e.add('items', 'REQUIRED');
    else if (body.items.length > 200) e.add('items', 'TOO_MANY');
    else {
      const map = new Map();
      for (const it of body.items) {
        const pid = Number(it?.productId);
        const qty = Number(it?.quantity);
        if (!Number.isInteger(pid) || pid < 1 || !Number.isInteger(qty) || qty < 0 || qty > 100000) {
          e.add('items', 'INVALID_ITEM');
          break;
        }
        if (qty > 0) map.set(pid, (map.get(pid) || 0) + qty);
      }
      if (map.size === 0 && !e.errors.length) e.add('items', 'EMPTY');
      out.items = [...map].map(([productId, quantity]) => ({ productId, quantity }));
    }
  }
  e.throwIfAny();
  return out;
}

function validateSupportMessage(body) {
  const message = str(body.message);
  if (!message) throw ApiError.validation([{ field: 'message', code: 'REQUIRED' }]);
  if (message.length < 10) throw ApiError.validation([{ field: 'message', code: 'TOO_SHORT' }]);
  if (message.length > 1000) throw ApiError.validation([{ field: 'message', code: 'TOO_LONG' }]);
  return { message };
}

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];

function validateOrderStatus(body) {
  const status = str(body.status);
  if (!ORDER_STATUSES.includes(status)) throw ApiError.validation([{ field: 'status', code: 'INVALID_STATUS' }]);
  return status;
}

function validateMonth(value) {
  if (value === undefined || value === '') {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  const v = String(value);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) {
    throw ApiError.badRequest('INVALID_PARAMETER', 'El parámetro "month" debe tener el formato AAAA-MM.', { field: 'month' });
  }
  return v;
}

module.exports = {
  validateAddress,
  validateCard,
  validateQuantity,
  validateCheckout,
  validateSupportMessage,
  validateOrderStatus,
  validateMonth,
  ORDER_STATUSES,
  luhn,
};
