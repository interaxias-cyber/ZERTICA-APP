'use strict';

const router = require('express').Router();
const h = require('../utils/asyncHandler');
const c = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

router.post('/register', h(c.register));
router.post('/login', h(c.login));
router.post('/forgot-password', h(c.forgotPassword));
router.post('/reset-password', h(c.resetPassword));
router.post('/logout', authenticate, h(c.logout));

module.exports = router;
