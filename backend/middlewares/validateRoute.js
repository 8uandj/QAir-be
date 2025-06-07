const { body } = require('express-validator');

exports.validateCreateRoute = [
  body('departure_airport_id').isUUID().withMessage('ID sân bay đi không hợp lệ'),
  body('arrival_airport_id').isUUID().withMessage('ID sân bay đến không hợp lệ'),
  body('distance')
    .isFloat({ min: 0 })
    .withMessage('Khoảng cách phải là số dương'),
  body('base_price')
    .isFloat({ min: 0 })
    .withMessage('Giá cơ bản phải là số không âm')
];