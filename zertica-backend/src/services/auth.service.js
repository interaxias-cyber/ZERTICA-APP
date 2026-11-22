'use strict';

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/user.model');
const mailService = require('./mail.service');
const { toUserDto } = require('./dto');

/**
 * Sesión: JWT firmado (decisión pendiente 3 → propuesta JWT, sin tabla de
 * sesiones). El token incluye el id y el rol; el middleware vuelve a consultar
 * el usuario para rechazar cuentas desactivadas al instante (RN05).
 */
const DUMMY_HASH = bcrypt.hashSync('zertica-dummy-password', 10);

function signSession(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
    issuer: 'zertica-api',
    audience: 'zertica-app',
  });
}

function sessionResponse(user) {
  const token = signSession(user);
  const { exp } = jwt.decode(token);
  return { token, expiresAt: new Date(exp * 1000).toISOString(), user: toUserDto(user) };
}

async function ensureUnique({ username, email }, excludeId) {
  const details = [];
  if (username && (await userModel.existsUsername(username, excludeId))) {
    details.push({ field: 'username', code: 'ALREADY_EXISTS' });
  }
  if (email && (await userModel.existsEmail(email, excludeId))) {
    details.push({ field: 'email', code: 'ALREADY_EXISTS' });
  }
  if (details.length > 0) {
    throw ApiError.conflict('ALREADY_EXISTS', 'El usuario o el correo ya están registrados.', details);
  }
}

/** CU-01 / CU-02 */
async function register(data) {
  await ensureUnique(data);
  const passwordHash = await bcrypt.hash(data.password, env.bcryptRounds);
  const id = await userModel.create({ ...data, passwordHash });
  const user = await userModel.findById(id);
  return sessionResponse(user);
}

/** CU-03: credenciales incorrectas → 401; cuenta desactivada → 403. */
async function login({ username, password }) {
  const user = await userModel.findByLoginWithHash(username);
  // Se compara siempre para no revelar por tiempo si el usuario existe.
  const hash = user ? user.password_hash : DUMMY_HASH;
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) {
    throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Usuario, correo o contraseña incorrectos.');
  }
  if (!user.is_active) {
    throw ApiError.forbidden('ACCOUNT_DISABLED', 'La cuenta está desactivada. Contacte al administrador.');
  }
  return sessionResponse(user);
}

/**
 * El código de recuperación es un JWT de un solo uso: se firma con el secreto
 * más el hash actual de la contraseña, así que deja de valer en cuanto la
 * contraseña cambia. No requiere tablas nuevas.
 */
function resetSecret(user) {
  return `${env.jwt.secret}.${user.password_hash}`;
}

function shortCode(token) {
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 8);
}

/** CU-04. Siempre responde igual para no revelar si el correo existe. */
async function forgotPassword({ email }) {
  const user = await userModel.findByEmailWithHash(email);
  const result = {
    message: 'Si el correo está registrado, recibirá instrucciones para restablecer la contraseña.',
  };
  if (!user || !user.is_active) return result;

  const token = jwt.sign({ sub: String(user.id), purpose: 'password-reset' }, resetSecret(user), {
    expiresIn: env.jwt.resetExpiresIn,
    issuer: 'zertica-api',
  });

  if (mailService.isConfigured()) {
    await mailService.sendPasswordReset(user, token);
  } else if (!env.isProduction) {
    // Sin servicio de correo (decisión pendiente 7): modo desarrollo.
    console.log(`[DEV] Código de recuperación para ${user.username} (${shortCode(token)}):\n${token}`);
    result.devResetToken = token;
  }
  return result;
}

async function resetPassword({ token, password }) {
  const decoded = jwt.decode(token);
  const invalid = () => ApiError.badRequest('INVALID_RESET_TOKEN', 'El código de recuperación no es válido o ha vencido.');
  if (!decoded || decoded.purpose !== 'password-reset' || !decoded.sub) throw invalid();

  const user = await userModel.findByIdWithHash(Number(decoded.sub));
  if (!user || !user.is_active) throw invalid();
  try {
    jwt.verify(token, resetSecret(user), { issuer: 'zertica-api' });
  } catch {
    throw invalid();
  }
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  await userModel.updatePasswordHash(user.id, passwordHash);
  return { message: 'Contraseña restablecida. Ya puede iniciar sesión.' };
}

/** CU-08: verifica la contraseña actual antes de guardar el nuevo hash. */
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await userModel.findByIdWithHash(userId);
  if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'Usuario no encontrado.');
  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) {
    throw ApiError.validation([{ field: 'currentPassword', code: 'INCORRECT_PASSWORD' }]);
  }
  const passwordHash = await bcrypt.hash(newPassword, env.bcryptRounds);
  await userModel.updatePasswordHash(userId, passwordHash);
}

module.exports = {
  signSession,
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  ensureUnique,
};
