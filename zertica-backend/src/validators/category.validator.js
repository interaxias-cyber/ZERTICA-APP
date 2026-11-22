'use strict';

const { FieldErrors, str } = require('./common');

function validateCategoryBody(body) {
  const errors = new FieldErrors();
  const name = str(body.name);
  if (!name) errors.add('name', 'REQUIRED');
  else if (name.length > 100) errors.add('name', 'TOO_LONG');
  errors.throwIfAny();
  return { name };
}

module.exports = { validateCategoryBody };
