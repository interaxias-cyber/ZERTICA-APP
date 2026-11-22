'use strict';

const router = require('express').Router();
const h = require('../utils/asyncHandler');
const c = require('../controllers/profile.controller');

router.get('/', h(c.me));
router.patch('/', h(c.update));
router.put('/password', h(c.changePassword));

module.exports = router;
