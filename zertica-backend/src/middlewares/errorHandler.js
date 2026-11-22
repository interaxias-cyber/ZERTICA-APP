'use strict';

const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(ApiError.notFound('ROUTE_NOT_FOUND', `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

/** Respuesta uniforme { error: { code, message, details? } } (RN18, RNF07). */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const body = { code: err.code, message: err.message };
    if (err.details !== undefined) body.details = err.details;
    return res.status(err.status).json({ error: body });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'El cuerpo de la petición no es JSON válido.' } });
  }
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: { code: 'ALREADY_EXISTS', message: 'El registro ya existe.' } });
  }
  if (err && ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ETIMEDOUT'].includes(err.code)) {
    console.error('[DB]', err.code, err.message);
    return res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Servicio no disponible. Intente más tarde.' } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' } });
}

module.exports = { notFound, errorHandler };
