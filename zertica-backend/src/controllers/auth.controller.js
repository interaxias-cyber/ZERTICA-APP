'use strict';

const v = require('../validators/auth.validator');
const authService = require('../services/auth.service');

module.exports = {
  async register(req, res) {
    res.status(201).json(await authService.register(v.validateRegister(req.body || {})));
  },
  async login(req, res) {
    res.json(await authService.login(v.validateLogin(req.body || {})));
  },
  async forgotPassword(req, res) {
    res.json(await authService.forgotPassword(v.validateForgotPassword(req.body || {})));
  },
  async resetPassword(req, res) {
    res.json(await authService.resetPassword(v.validateResetPassword(req.body || {})));
  },
  /** JWT sin estado: el cierre real ocurre en la app al borrar el token (CU-05). */
  async logout(req, res) {
    res.status(204).end();
  },
};
