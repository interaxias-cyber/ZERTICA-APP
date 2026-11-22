'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/user.model');

/**
 * Middleware de autenticación (RF10, RN01): exige "Authorization: Bearer <token>",
 * verifica la firma y que la cuenta siga existiendo y activa (RN05).
 */
async function authenticate(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('UNAUTHORIZED', 'Debe iniciar sesión para continuar.');
    }
    let payload;
    try {
      payload = jwt.verify(token, env.jwt.secret, { issuer: 'zertica-api', audience: 'zertica-app' });
    } catch (err) {
      throw ApiError.unauthorized(
        err.name === 'TokenExpiredError' ? 'SESSION_EXPIRED' : 'INVALID_TOKEN',
        err.name === 'TokenExpiredError' ? 'La sesión ha vencido. Inicie sesión nuevamente.' : 'Sesión no válida.',
      );
    }
    const user = await userModel.findById(Number(payload.sub));
    if (!user) throw ApiError.unauthorized('INVALID_TOKEN', 'Sesión no válida.');
    if (!user.is_active) {
      throw ApiError.forbidden('ACCOUNT_DISABLED', 'La cuenta está desactivada. Contacte al administrador.');
    }
    req.user = { id: user.id, role: user.role, username: user.username, language: user.language, companyId: user.company_id };
    next();
  } catch (err) {
    next(err);
  }
}

/** Autorización por rol (RNF02, RN06). */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('FORBIDDEN', 'No tiene permisos para realizar esta acción.'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
