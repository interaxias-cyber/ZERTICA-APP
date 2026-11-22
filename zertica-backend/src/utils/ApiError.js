'use strict';

/**
 * Error controlado de la API. `code` es un identificador estable que la app
 * traduce a español o inglés (RNF08).
 */
class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
  }

  static badRequest(code, message, details) {
    return new ApiError(400, code, message, details);
  }

  static validation(details) {
    return new ApiError(400, 'VALIDATION_ERROR', 'Los datos enviados no son válidos.', details);
  }

  static unauthorized(code = 'UNAUTHORIZED', message = 'Debe iniciar sesión.') {
    return new ApiError(401, code, message);
  }

  static forbidden(code = 'FORBIDDEN', message = 'No tiene permisos para realizar esta acción.') {
    return new ApiError(403, code, message);
  }

  static notFound(code = 'NOT_FOUND', message = 'Recurso no encontrado.') {
    return new ApiError(404, code, message);
  }

  static conflict(code, message, details) {
    return new ApiError(409, code, message, details);
  }
}

module.exports = ApiError;
