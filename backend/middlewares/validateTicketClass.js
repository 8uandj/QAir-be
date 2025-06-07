const { body, param } = require('express-validator');

exports.validateCreateTicketClass = [
  body('class_name').notEmpty().withMessage('Tên hạng vé là bắt buộc'),
  body('coefficient')
    .isFloat({ min: 0 })
    .withMessage('Hệ số giá phải là số không âm')
];

exports.validateUpdateTicketClass = [
  param('id').isUUID().withMessage('ID hạng vé không hợp lệ'),
  body('class_name').notEmpty().withMessage('Tên hạng vé là bắt buộc'),
  body('coefficient')
    .isFloat({ min: 0 })
    .withMessage('Hệ số giá phải là số không âm')
];

exports.validateGetPerks = [
  param('id').isUUID().withMessage('ID hạng vé không hợp lệ')
];