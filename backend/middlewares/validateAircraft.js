const { body, param } = require('express-validator');

exports.validateCreateAircraft = [
  body('airline_id').isUUID().withMessage('ID hãng hàng không không hợp lệ'),
  body('aircraft_type').notEmpty().withMessage('Loại máy bay là bắt buộc'),
  body('total_first_class_seats')
    .isInt({ min: 0 })
    .withMessage('Số ghế hạng nhất phải là số không âm'),
  body('total_business_class_seats')
    .isInt({ min: 0 })
    .withMessage('Số ghế hạng thương gia phải là số không âm'),
  body('total_economy_class_seats')
    .isInt({ min: 0 })
    .withMessage('Số ghế hạng phổ thông phải là số không âm'),
  body('status')
    .notEmpty()
    .withMessage('Trạng thái là bắt buộc'),
  body('aircraft_code')
    .notEmpty()
    .withMessage('Mã máy bay là bắt buộc'),
  body('manufacturer')
    .notEmpty()
    .withMessage('Hãng sản xuất là bắt buộc'),
  body('seat_layout')
    .notEmpty()
    .withMessage('Sơ đồ ghế là bắt buộc')
    .isObject()
    .withMessage('Sơ đồ ghế phải là một object')
    .custom((value, { req }) => {
      if (!value.first_class || !value.business_class || !value.economy_class) {
        throw new Error('Sơ đồ ghế phải chứa first_class, business_class, economy_class');
      }
      const countSeats = (classType) => {
        return (value[classType] || []).reduce((total, cabin) => total + (cabin.seats || []).length, 0);
      };
      const firstClassSeats = countSeats('first_class');
      const businessClassSeats = countSeats('business_class');
      const economyClassSeats = countSeats('economy_class');
      if (
        firstClassSeats !== parseInt(req.body.total_first_class_seats) ||
        businessClassSeats !== parseInt(req.body.total_business_class_seats) ||
        economyClassSeats !== parseInt(req.body.total_economy_class_seats)
      ) {
        throw new Error('Số ghế trong seat_layout không khớp với total_<class>_seats');
      }
      return true;
    })
];

exports.validateUpdateAircraft = [
  param('id').isUUID().withMessage('ID máy bay không hợp lệ'),
  body('airline_id').isUUID().withMessage('ID hãng hàng không không hợp lệ'),
  body('aircraft_type').notEmpty().withMessage('Loại máy bay là bắt buộc'),
  body('total_first_class_seats')
    .isInt({ min: 0 })
    .withMessage('Số ghế hạng nhất phải là số không âm'),
  body('total_business_class_seats')
    .isInt({ min: 0 })
    .withMessage('Số ghế hạng thương gia phải là số không âm'),
  body('total_economy_class_seats')
    .isInt({ min: 0 })
    .withMessage('Số ghế hạng phổ thông phải là số không âm'),
  body('status')
    .notEmpty()
    .withMessage('Trạng thái là bắt buộc'),
  body('aircraft_code')
    .notEmpty()
    .withMessage('Mã máy bay là bắt buộc'),
  body('manufacturer')
    .notEmpty()
    .withMessage('Hãng sản xuất là bắt buộc'),
  body('seat_layout')
    .optional()
    .isObject()
    .withMessage('Sơ đồ ghế phải là một object')
    .custom((value, { req }) => {
      if (value && (!value.first_class || !value.business_class || !value.economy_class)) {
        throw new Error('Sơ đồ ghế phải chứa first_class, business_class, economy_class');
      }
      if (value) {
        const countSeats = (classType) => {
          return (value[classType] || []).reduce((total, cabin) => total + (cabin.seats || []).length, 0);
        };
        const firstClassSeats = countSeats('first_class');
        const businessClassSeats = countSeats('business_class');
        const economyClassSeats = countSeats('economy_class');
        if (
          firstClassSeats !== parseInt(req.body.total_first_class_seats) ||
          businessClassSeats !== parseInt(req.body.total_business_class_seats) ||
          economyClassSeats !== parseInt(req.body.total_economy_class_seats)
        ) {
          throw new Error('Số ghế trong seat_layout không khớp với total_<class>_seats');
        }
      }
      return true;
    })
];

exports.validateGetAircraftById = [
  param('id').isUUID().withMessage('ID máy bay không hợp lệ')
];