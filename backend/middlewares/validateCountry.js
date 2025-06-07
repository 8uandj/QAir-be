const { body, param, query } = require('express-validator');
const pool = require('../config/db'); // Import pool từ db.js
const { handleValidationErrors } = require('../middlewares/validateUtils');

// Thông điệp lỗi chung
const errorMessages = {
  required: (field) => `${field} là bắt buộc`,
  notEmpty: (field) => `${field} không được để trống nếu có`,
  invalidUUID: (field) => `${field} không hợp lệ`,
  unique: (field) => `${field} đã tồn tại`,
  notFound: (field) => `${field} không tồn tại`,
  invalidCode: 'Mã quốc gia phải là mã ISO 3166-1 alpha-2 (2 chữ hoa)',
  invalidInt: (field) => `${field} phải là số nguyên dương`,
};

// Validate tạo quốc gia
exports.validateCreateCountry = [
  body('name')
    .notEmpty().withMessage(errorMessages.required('Tên quốc gia'))
    .trim()
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT name FROM countries WHERE name = $1', [value]);
        if (result.rows.length > 0) {
          throw new Error(errorMessages.unique('Tên quốc gia'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra tên quốc gia: ${err.message}`);
      }
      return true;
    }),
  body('code')
    .notEmpty().withMessage(errorMessages.required('Mã quốc gia'))
    .trim()
    .isLength({ min: 2, max: 2 }).withMessage(errorMessages.invalidCode)
    .matches(/^[A-Z]{2}$/).withMessage(errorMessages.invalidCode)
    .toUpperCase()
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT code FROM countries WHERE code = $1', [value]);
        if (result.rows.length > 0) {
          throw new Error(errorMessages.unique('Mã quốc gia'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra mã quốc gia: ${err.message}`);
      }
      return true;
    }),
];

// Validate cập nhật quốc gia
exports.validateUpdateCountry = [
  param('id')
    .isUUID().withMessage(errorMessages.invalidUUID('ID quốc gia'))
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT id FROM countries WHERE id = $1', [value]);
        if (result.rows.length === 0) {
          throw new Error(errorMessages.notFound('Quốc gia'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra quốc gia: ${err.message}`);
      }
      return true;
    }),
  body('name')
    .optional()
    .notEmpty().withMessage(errorMessages.notEmpty('Tên quốc gia'))
    .trim()
    .custom(async (value, { req }) => {
      if (value) {
        try {
          const result = await pool.query('SELECT name FROM countries WHERE name = $1 AND id != $2', [value, req.params.id]);
          if (result.rows.length > 0) {
            throw new Error(errorMessages.unique('Tên quốc gia'));
          }
        } catch (err) {
          throw new Error(`Lỗi kiểm tra tên quốc gia: ${err.message}`);
        }
      }
      return true;
    }),
  body('code')
    .optional()
    .notEmpty().withMessage(errorMessages.notEmpty('Mã quốc gia'))
    .trim()
    .isLength({ min: 2, max: 2 }).withMessage(errorMessages.invalidCode)
    .matches(/^[A-Z]{2}$/).withMessage(errorMessages.invalidCode)
    .toUpperCase()
    .custom(async (value, { req }) => {
      if (value) {
        try {
          const result = await pool.query('SELECT code FROM countries WHERE code = $1 AND id != $2', [value, req.params.id]);
          if (result.rows.length > 0) {
            throw new Error(errorMessages.unique('Mã quốc gia'));
          }
        } catch (err) {
          throw new Error(`Lỗi kiểm tra mã quốc gia: ${err.message}`);
        }
      }
      return true;
    }),
];

// Validate lấy quốc gia theo ID
exports.validateGetCountryById = [
  param('id')
    .isUUID().withMessage(errorMessages.invalidUUID('ID quốc gia'))
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT id FROM countries WHERE id = $1', [value]);
        if (result.rows.length === 0) {
          throw new Error(errorMessages.notFound('Quốc gia'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra quốc gia: ${err.message}`);
      }
      return true;
    }),
];

// Validate xóa quốc gia
exports.validateDeleteCountry = [
  param('id')
    .isUUID().withMessage(errorMessages.invalidUUID('ID quốc gia'))
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT id FROM countries WHERE id = $1', [value]);
        if (result.rows.length === 0) {
          throw new Error(errorMessages.notFound('Quốc gia'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra quốc gia: ${err.message}`);
      }
      return true;
    }),
];

// Validate lấy tất cả quốc gia
exports.validateGetAllCountries = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(errorMessages.invalidInt('Trang'))
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(errorMessages.invalidInt('Giới hạn'))
    .toInt(),
];