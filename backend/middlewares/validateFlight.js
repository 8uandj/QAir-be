const { body, param } = require('express-validator');

exports.validateSearchFlights = [
  body('legs')
    .isArray({ min: 1 })
    .withMessage('Danh sách legs phải là một mảng không rỗng'),
  body('legs.*.from_airport_id')
    .isUUID()
    .withMessage('ID sân bay đi không hợp lệ'),
  body('legs.*.to_airport_id')
    .isUUID()
    .withMessage('ID sân bay đến không hợp lệ'),
  body('legs.*.date')
    .isISO8601()
    .toDate()
    .withMessage('Ngày không hợp lệ')
];

exports.validateDelayFlight = [
  param('id')
    .isUUID()
    .withMessage('ID chuyến bay không hợp lệ'),
  body('newDeparture')
    .isISO8601()
    .toDate()
    .withMessage('Thời gian khởi hành mới không hợp lệ'),
  body('newArrival')
    .isISO8601()
    .toDate()
    .withMessage('Thời gian đến mới không hợp lệ')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.newDeparture)) {
        throw new Error('Thời gian đến mới phải sau thời gian khởi hành mới');
      }
      return true;
    })
];

// Validate hiện có cho createFlight giữ nguyên
exports.validateCreateFlight = [
  body('airline_id').isUUID().withMessage('ID hãng hàng không không hợp lệ'),
  body('route_id').isUUID().withMessage('ID tuyến đường không hợp lệ'),
  body('aircraft_id').isUUID().withMessage('ID máy bay không hợp lệ'),
  body('flight_number')
    .notEmpty()
    .withMessage('Số hiệu chuyến bay là bắt buộc')
    .isLength({ max: 10 })
    .withMessage('Số hiệu chuyến bay quá dài'),
  body('departure_time')
    .isISO8601()
    .toDate()
    .withMessage('Thời gian khởi hành không hợp lệ'),
  body('arrival_time')
    .isISO8601()
    .toDate()
    .withMessage('Thời gian đến không hợp lệ')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.departure_time)) {
        throw new Error('Thời gian đến phải sau thời gian khởi hành');
      }
      return true;
    }),
  body('base_economy_class_price')
    .isFloat({ min: 0 })
    .withMessage('Giá hạng phổ thông phải là số không âm'),
  body('base_business_class_price')
    .isFloat({ min: 0 })
    .withMessage('Giá hạng thương gia phải là số không âm'),
  body('base_first_class_price')
    .isFloat({ min: 0 })
    .withMessage('Giá hạng nhất phải là số không âm'),
  body('flight_status')
    .optional()
    .isIn(['Scheduled', 'Delayed', 'Cancelled', 'Completed'])
    .withMessage('Trạng thái chuyến bay không hợp lệ')
];