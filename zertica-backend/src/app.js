'use strict';

const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { UPLOAD_ROOT } = require('./middlewares/upload');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(cors({ origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '100kb' }));

// Imágenes de producto (CU-21).
app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '7d', fallthrough: false }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
