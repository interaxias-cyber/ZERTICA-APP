'use strict';

const router = require('express').Router();
const h = require('../utils/asyncHandler');
const c = require('../controllers/product.controller');

router.get('/', h(c.list));
router.get('/:id', h(c.detail));

module.exports = router;
