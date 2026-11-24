'use strict';

/**
 * Crea (o actualiza) una cuenta administradora con contraseña hasheada (bcrypt).
 * Uso: npm run seed:admin -- <usuario> <correo> <contraseña> ["Nombre completo"]
 */
require('dotenv').config();
const bcrypt = require('../src/utils/bcrypt');
const mysql = require('mysql2/promise');

async function main() {
  const [username, email, password, fullName = 'Administrador Zertica'] = process.argv.slice(2);
  if (!username || !email || !password) {
    console.error('Uso: npm run seed:admin -- <usuario> <correo> <contraseña> ["Nombre completo"]');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 10);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    socketPath: process.env.DB_SOCKET || undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  });
  try {
    await connection.execute(
      `INSERT INTO users (username, full_name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, 'admin', 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', is_active = 1`,
      [username, fullName, email.toLowerCase(), hash],
    );
    console.log(`✔ Administrador "${username}" listo.`);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('✖', err.message);
  process.exit(1);
});
