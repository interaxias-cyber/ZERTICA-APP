'use strict';

const v = require('../validators/auth.validator');
const userService = require('../services/user.service');
const authService = require('../services/auth.service');

module.exports = {
  async me(req, res) {
    res.json(await userService.getProfile(req.user.id));
  },
  async update(req, res) {
    res.json(await userService.updateProfile(req.user.id, v.validateProfileUpdate(req.body || {})));
  },
  async changePassword(req, res) {
    await authService.changePassword(req.user.id, v.validateChangePassword(req.body || {}));
    res.json({ message: 'Contraseña actualizada.' });
  },
};
