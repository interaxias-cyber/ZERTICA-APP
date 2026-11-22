'use strict';

/**
 * Crea la base `zertica`, sus 5 tablas y carga los datos de prueba.
 * Uso: npm run db:init            (esquema + datos de prueba)
 *      npm run db:init -- --no-seed (solo esquema)
 * ATENCIÓN: borra y vuelve a crear las tablas.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const withSeed = !process.argv.includes('--no-seed');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_ADMIN_USER || process.env.DB_USER,
    password: process.env.DB_ADMIN_USER ? process.env.DB_ADMIN_PASSWORD || '' : process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4',
  });
  try {
    const files = ['schema.sql', ...(withSeed ? ['seed.sql'] : [])];
    for (const file of files) {
      const sql = fs.readFileSync(path.join(__dirname, '..', 'database', file), 'utf8');
      await connection.query(sql);
      console.log(`✔ ${file} ejecutado`);
    }
    if (withSeed) {
      const from = path.join(__dirname, '..', 'database', 'seed-images');
      const to = path.join(__dirname, '..', process.env.UPLOADS_DIR || 'uploads', 'products');
      fs.mkdirSync(to, { recursive: true });
      for (const name of fs.readdirSync(from)) fs.copyFileSync(path.join(from, name), path.join(to, name));
      console.log('✔ imágenes de prueba copiadas a uploads/products');
    }
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('✖ Error inicializando la base de datos:', err.message);
  process.exit(1);
});
