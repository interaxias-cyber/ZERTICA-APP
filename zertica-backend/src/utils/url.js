'use strict';

const env = require('../config/env');

/** Convierte una ruta relativa de imagen (/uploads/x.jpg) en URL absoluta. */
function absoluteUrl(req, path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = env.publicBaseUrl || `${req.protocol}://${req.get('host')}`;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

module.exports = { absoluteUrl };
