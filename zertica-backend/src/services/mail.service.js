'use strict';

const env = require('../config/env');

let transporter = null;

function isConfigured() {
  return Boolean(env.mail.host);
}

function getTransporter() {
  if (!transporter) {
    // eslint-disable-next-line global-require
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
    });
  }
  return transporter;
}

const TEXT = {
  es: {
    subject: 'Zertica · Recuperación de contraseña',
    body: (name, code, minutes) =>
      `Hola ${name}:\n\nRecibimos una solicitud para restablecer tu contraseña en Zertica.\n` +
      `Copia este código en la aplicación (válido por ${minutes}):\n\n${code}\n\n` +
      'Si no solicitaste el cambio, ignora este mensaje.',
  },
  en: {
    subject: 'Zertica · Password recovery',
    body: (name, code, minutes) =>
      `Hi ${name},\n\nWe received a request to reset your Zertica password.\n` +
      `Paste this code in the app (valid for ${minutes}):\n\n${code}\n\n` +
      'If you did not request it, ignore this message.',
  },
};

async function sendPasswordReset(user, token) {
  const t = TEXT[user.language] || TEXT.es;
  await getTransporter().sendMail({
    from: env.mail.from,
    to: user.email,
    subject: t.subject,
    text: t.body(user.full_name, token, env.jwt.resetExpiresIn),
  });
}

module.exports = { isConfigured, sendPasswordReset };
