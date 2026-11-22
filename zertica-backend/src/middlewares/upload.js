'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', env.uploads.dir);
const PRODUCTS_DIR = path.join(UPLOAD_ROOT, 'products');
fs.mkdirSync(PRODUCTS_DIR, { recursive: true });

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PRODUCTS_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: env.uploads.maxSizeMb * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      return cb(ApiError.validation([{ field: 'image', code: 'INVALID_IMAGE_TYPE' }]));
    }
    return cb(null, true);
  },
});

/** CU-21: un único archivo "image" (JPG, PNG o WEBP). */
function productImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const code = err.code === 'LIMIT_FILE_SIZE' ? 'IMAGE_TOO_LARGE' : 'INVALID_IMAGE';
      return next(ApiError.validation([{ field: 'image', code }]));
    }
    return next(err);
  });
}

function publicPath(file) {
  return file ? `/uploads/products/${file.filename}` : null;
}

/** Borra un archivo subido (p. ej. si la validación falla o se reemplaza). */
function removeFile(relativePath) {
  if (!relativePath || !relativePath.startsWith('/uploads/')) return;
  const abs = path.join(UPLOAD_ROOT, relativePath.replace(/^\/uploads\//, ''));
  if (!abs.startsWith(UPLOAD_ROOT)) return;
  fs.promises.unlink(abs).catch(() => {});
}

module.exports = { productImage, publicPath, removeFile, UPLOAD_ROOT };
