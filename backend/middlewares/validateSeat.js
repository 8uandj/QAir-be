const { body, param } = require('express-validator');

const validateGetSeatMap = [
  param('flight_id').isUUID().withMessage('ID chuyến bay phải là UUID hợp lệ')
];

const validateSeatSelection = [
  body('flight_id').isUUID().withMessage('ID chuyến bay phải là UUID hợp lệ'),
  body('seat_number').notEmpty().withMessage('Số ghế là bắt buộc'),
  body('ticket_class_id').isUUID().withMessage('ID hạng vé phải là UUID hợp lệ')
];

module.exports = { validateGetSeatMap, validateSeatSelection };