'use strict';

const { EMAIL_RE, USERNAME_RE, PASSWORD_RE, FieldErrors, str } = require('./common');

const LANGUAGES = ['es', 'en'];

function validateRegister(body) {
  const errors = new FieldErrors();
  const username = str(body.username);
  const fullName = str(body.fullName ?? body.full_name);
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const language = str(body.language) || 'es';

  if (!username) errors.add('username', 'REQUIRED');
  else if (!USERNAME_RE.test(username)) errors.add('username', 'INVALID_FORMAT');

  if (!fullName) errors.add('fullName', 'REQUIRED');
  else if (fullName.length < 3 || fullName.length > 120) errors.add('fullName', 'INVALID_LENGTH');

  if (!email) errors.add('email', 'REQUIRED');
  else if (email.length > 150 || !EMAIL_RE.test(email)) errors.add('email', 'INVALID_FORMAT');

  if (!password) errors.add('password', 'REQUIRED');
  else if (!PASSWORD_RE.test(password)) errors.add('password', 'WEAK_PASSWORD');

  if (!LANGUAGES.includes(language)) errors.add('language', 'INVALID_LANGUAGE');

  errors.throwIfAny();
  return { username, fullName, email, password, language };
}

/** El diseño de Figma pide correo; los casos de uso, usuario: se aceptan ambos. */
function validateLogin(body) {
  const errors = new FieldErrors();
  const username = str(body.username ?? body.email ?? body.identifier);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username) errors.add('username', 'REQUIRED');
  if (!password) errors.add('password', 'REQUIRED');
  errors.throwIfAny();
  return { username, password };
}

function validateForgotPassword(body) {
  const errors = new FieldErrors();
  const email = str(body.email).toLowerCase();
  if (!email) errors.add('email', 'REQUIRED');
  else if (!EMAIL_RE.test(email)) errors.add('email', 'INVALID_FORMAT');
  errors.throwIfAny();
  return { email };
}

function validateResetPassword(body) {
  const errors = new FieldErrors();
  const token = str(body.token);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!token) errors.add('token', 'REQUIRED');
  if (!password) errors.add('password', 'REQUIRED');
  else if (!PASSWORD_RE.test(password)) errors.add('password', 'WEAK_PASSWORD');
  errors.throwIfAny();
  return { token, password };
}

function validateProfileUpdate(body) {
  const errors = new FieldErrors();
  const out = {};
  if (body.fullName !== undefined || body.full_name !== undefined) {
    const fullName = str(body.fullName ?? body.full_name);
    if (!fullName) errors.add('fullName', 'REQUIRED');
    else if (fullName.length < 3 || fullName.length > 120) errors.add('fullName', 'INVALID_LENGTH');
    else out.fullName = fullName;
  }
  if (body.email !== undefined) {
    const email = str(body.email).toLowerCase();
    if (!email) errors.add('email', 'REQUIRED');
    else if (email.length > 150 || !EMAIL_RE.test(email)) errors.add('email', 'INVALID_FORMAT');
    else out.email = email;
  }
  if (body.phone !== undefined) {
    const phone = str(body.phone);
    if (phone && !/^\+?[0-9 ()-]{7,30}$/.test(phone)) errors.add('phone', 'INVALID_FORMAT');
    else out.phone = phone || null;
  }
  if (body.language !== undefined) {
    const language = str(body.language);
    if (!LANGUAGES.includes(language)) errors.add('language', 'INVALID_LANGUAGE');
    else out.language = language;
  }
  if (Object.keys(out).length === 0 && errors.errors.length === 0) errors.add('body', 'EMPTY');
  errors.throwIfAny();
  return out;
}

function validateChangePassword(body) {
  const errors = new FieldErrors();
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!currentPassword) errors.add('currentPassword', 'REQUIRED');
  if (!newPassword) errors.add('newPassword', 'REQUIRED');
  else if (!PASSWORD_RE.test(newPassword)) errors.add('newPassword', 'WEAK_PASSWORD');
  else if (newPassword === currentPassword) errors.add('newPassword', 'SAME_AS_CURRENT');
  errors.throwIfAny();
  return { currentPassword, newPassword };
}

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateProfileUpdate,
  validateChangePassword,
};
