'use strict';

const env = require('./config/env');
const app = require('./app');
const { pool, testConnection } = require('./config/db');

async function start() {
  try {
    await testConnection();
  } catch (err) {
    // RNF11: el servidor no arranca sin conexión a la base.
    console.error('✖ No se pudo conectar a MySQL:', err.message);
    process.exit(1);
  }

  const server = app.listen(env.port, env.host, () => {
    console.log(`✔ Zertica API escuchando en http://${env.host}:${env.port}/api (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} recibido. Cerrando…`);
    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
