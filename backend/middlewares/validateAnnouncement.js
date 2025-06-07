const { body, param } = require('express-validator');
const pool = require('../config/db'); // Import pool từ db.js
const { handleValidationErrors } = require('../middlewares/validateUtils');

// Thông điệp lỗi chung
const errorMessages = {
  required: (field) => `${field} là bắt buộc`,
  notEmpty: (field) => `${field} không được rỗng nếu có`,
  invalidUUID: (field) => `${field} không hợp lệ`,
  invalidType: (field) => `${field} không hợp lệ`,
  unique: (field) => `${field} đã tồn tại`,
  notFound: (field) => `${field} không tồn tại`,
  invalidDate: (field) => `${field} không hợp lệ`,
  dateOrder: 'Ngày kết thúc phải sau ngày bắt đầu',
};

// Validate tạo thông báo
exports.validateCreateAnnouncement = [
  body('title')
    .notEmpty().withMessage(errorMessages.required('Tiêu đề'))
    .trim()
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT title FROM announcements WHERE title = $1', [value]);
        if (result.rows.length > 0) {
          throw new Error(errorMessages.unique('Tiêu đề'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra tiêu đề: ${err.message}`);
      }
      return true;
    }),
  body('content')
    .notEmpty().withMessage(errorMessages.required('Nội dung'))
    .trim(),
  body('type')
    .notEmpty().withMessage(errorMessages.required('Loại thông báo'))
    .isIn(['INFO', 'PROMOTION', 'WARNING', 'DELAY', 'MAINTENANCE'])
    .withMessage(errorMessages.invalidType('Loại thông báo'))
    .toUpperCase(),
  body('status')
    .notEmpty().withMessage(errorMessages.required('Trạng thái'))
    .isIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    .withMessage(errorMessages.invalidType('Trạng thái'))
    .toUpperCase(),
  body('start_date')
    .notEmpty().withMessage(errorMessages.required('Ngày bắt đầu'))
    .isISO8601().withMessage(errorMessages.invalidDate('Ngày bắt đầu'))
    .toDate(),
  body('end_date')
    .optional()
    .isISO8601().withMessage(errorMessages.invalidDate('Ngày kết thúc'))
    .toDate()
    .custom((value, { req }) => {
      if (value && req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
        throw new Error(errorMessages.dateOrder);
      }
      return true;
    }),
];

// Validate cập nhật thông báo
exports.validateUpdateAnnouncement = [
  param('id')
    .isUUID().withMessage(errorMessages.invalidUUID('ID thông báo'))
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT id FROM announcements WHERE id = $1', [value]);
        if (result.rows.length === 0) {
          throw new Error(errorMessages.notFound('Thông báo'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra thông báo: ${err.message}`);
      }
      return true;
    }),
  body('title')
    .optional()
    .notEmpty().withMessage(errorMessages.notEmpty('Tiêu đề'))
    .trim()
    .custom(async (value, { req }) => {
      if (value) {
        try {
          const result = await pool.query('SELECT title FROM announcements WHERE title = $1 AND id != $2', [value, req.params.id]);
          if (result.rows.length > 0) {
            throw new Error(errorMessages.unique('Tiêu đề'));
          }
        } catch (err) {
          throw new Error(`Lỗi kiểm tra tiêu đề: ${err.message}`);
        }
      }
      return true;
    }),
  body('content')
    .optional()
    .notEmpty().withMessage(errorMessages.notEmpty('Nội dung'))
    .trim(),
  body('type')
    .optional()
    .isIn(['INFO', 'PROMOTION', 'WARNING', 'DELAY', 'MAINTENANCE'])
    .withMessage(errorMessages.invalidType('Loại thông báo'))
    .toUpperCase(),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    .withMessage(errorMessages.invalidType('Trạng thái'))
    .toUpperCase(),
  body('start_date')
    .optional()
    .isISO8601().withMessage(errorMessages.invalidDate('Ngày bắt đầu'))
    .toDate(),
  body('end_date')
    .optional()
    .isISO8601().withMessage(errorMessages.invalidDate('Ngày kết thúc'))
    .toDate()
    .custom((value, { req }) => {
      const start = req.body.start_date || req.body.existing_start_date; // Fallback to existing if not provided
      if (value && start && new Date(value) <= new Date(start)) {
        throw new Error(errorMessages.dateOrder);
      }
      return true;
    }),
];

// Validate lấy thông báo theo ID
exports.validateGetAnnouncementById = [
  param('id')
    .isUUID().withMessage(errorMessages.invalidUUID('ID thông báo'))
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT id FROM announcements WHERE id = $1', [value]);
        if (result.rows.length === 0) {
          throw new Error(errorMessages.notFound('Thông báo'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra thông báo: ${err.message}`);
      }
      return true;
    }),
];

// Validate xóa thông báo
exports.validateDeleteAnnouncement = [
  param('id')
    .isUUID().withMessage(errorMessages.invalidUUID('ID thông báo'))
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT id FROM announcements WHERE id = $1', [value]);
        if (result.rows.length === 0) {
          throw new Error(errorMessages.notFound('Thông báo'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra thông báo: ${err.message}`);
      }
      return true;
    }),
];