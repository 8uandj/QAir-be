const { body } = require('express-validator');

exports.validateLogin = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('username').optional()
];
