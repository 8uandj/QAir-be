const { body, param, query } = require('express-validator');

exports.validateBookTicket = [
  body('flight_id').isUUID().withMessage('ID chuyến bay không hợp lệ'),
  body('customer_id').isUUID().withMessage('ID khách hàng không hợp lệ'),
  body('ticket_class_id').isUUID().withMessage('ID hạng vé không hợp lệ'),
  body('seat_number').optional().notEmpty().withMessage('Số ghế là bắt buộc nếu cung cấp'),
  body('cancellation_deadline')
    .isISO8601()
    .toDate()
    .withMessage('Hạn hủy không hợp lệ')
];

exports.validateBookMultipleTickets = [
  body('tickets')
    .isArray({ min: 1 })
    .withMessage('Danh sách vé phải là mảng không rỗng'),
  body('tickets.*.flight_id')
    .isUUID()
    .withMessage('ID chuyến bay không hợp lệ'),
  body('tickets.*.customer_id')
    .isUUID()
    .withMessage('ID khách hàng không hợp lệ'),
  body('tickets.*.ticket_class_id')
    .isUUID()
    .withMessage('ID hạng vé không hợp lệ'),
  body('tickets.*.seat_number')
    .notEmpty()
    .withMessage('Số ghế là bắt buộc'),
  body('tickets.*.price')
    .isFloat({ min: 0 })
    .withMessage('Giá vé không hợp lệ'),
  body('tickets.*.cancellation_deadline')
    .isISO8601()
    .withMessage('Hạn hủy không hợp lệ'), // Bỏ .toDate()
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Số lượng vé phải là số nguyên dương')
    .custom((value, { req }) => value === req.body.tickets.length)
    .withMessage('Số lượng vé không khớp với danh sách vé')
];
exports.validateTicketParams = [
  param('id').isUUID().withMessage('ID vé không hợp lệ')
];

exports.validateTicketCode = [
  param('code')
    .matches(/^TICKET-[A-Z0-9]{6}(-\d)?$/)
    .withMessage('Mã vé không hợp lệ: phải là TICKET-XXXXXX hoặc TICKET-XXXXXX-N (N là số từ 1-9)')
];

exports.validateGetTicketsByEmail = [
  param('email').isEmail().withMessage('Email không hợp lệ')
];

exports.validateTicketStats = [
  query('flight_id')
    .optional()
    .isUUID()
    .withMessage('ID chuyến bay không hợp lệ'),
  query('start_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Ngày bắt đầu không hợp lệ'),
  query('end_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Ngày kết thúc không hợp lệ')
    .custom((value, { req }) => {
      if (req.query.start_date && new Date(value) < new Date(req.query.start_date)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return true;
    }),
  query('ticket_status')
    .optional()
    .isIn(['Confirmed', 'Cancelled', 'PendingPayment'])
    .withMessage('Trạng thái vé không hợp lệ')
];