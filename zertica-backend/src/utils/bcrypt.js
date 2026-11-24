'use strict';

/**
 * bcrypt nativo si está disponible (más rápido); si no se pudo compilar
 * (p. ej. en Termux/Android), bcryptjs en JavaScript puro. Ambos usan el mismo
 * formato de hash ($2a/$2b), así que las contraseñas son compatibles.
 */
let impl;
try {
  impl = require('bcrypt');
} catch {
  impl = require('bcryptjs');
}

module.exports = impl;
