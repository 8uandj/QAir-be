const { body, param, query } = require('express-validator');
const pool = require('../config/db'); // Import pool từ db.js
const { handleValidationErrors } = require('../middlewares/validateUtils');

// Thông điệp lỗi chung
const errorMessages = {
  required: (field) => `${field} là bắt buộc`,
  notEmpty: (field) => `${field} không được rỗng nếu có`,
  invalidUUID: (field) => `${field} không hợp lệ`,
  unique: (field) => `${field} đã tồn tại`,
  notFound: (field) => `${field} không tồn tại`,
  invalidInt: (field) => `${field} phải là số nguyên dương`,
};

// Validate tạo thành phố
exports.validateCreateCity = [
  body('name')
    .notEmpty().withMessage(errorMessages.required('Tên thành phố'))
    .trim()
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT name FROM cities WHERE name = $1', [value]);
        if (result.rows.length > 0) {
          throw new Error(errorMessages.unique('Tên thành phố'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra tên thành phố: ${err.message}`);
      }
      return true;
    }),
  body('country_id')
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

// Validate cập nhật thành phố
exports.validateUpdateCity = [
  param('id')
    .isUUID().withMessage(errorMessages.invalidUUID('ID thành phố'))
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT id FROM cities WHERE id = $1', [value]);
        if (result.rows.length === 0) {
          throw new Error(errorMessages.notFound('Thành phố'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra thành phố: ${err.message}`);
      }
      return true;
    }),
  body('name')
    .optional()
    .notEmpty().withMessage(errorMessages.notEmpty('Tên thành phố'))
    .trim()
    .custom(async (value, { req }) => {
      if (value) {
        try {
          const result = await pool.query('SELECT name FROM cities WHERE name = $1 AND id != $2', [value, req.params.id]);
          if (result.rows.length > 0) {
            throw new Error(errorMessages.unique('Tên thành phố'));
          }
        } catch (err) {
          throw new Error(`Lỗi kiểm tra tên thành phố: ${err.message}`);
        }
      }
      return true;
    }),
  body('country_id')
    .optional()
    .isUUID().withMessage(errorMessages.invalidUUID('ID quốc gia'))
    .custom(async (value) => {
      if (value) {
        try {
          const result = await pool.query('SELECT id FROM countries WHERE id = $1', [value]);
          if (result.rows.length === 0) {
            throw new Error(errorMessages.notFound('Quốc gia'));
          }
        } catch (err) {
          throw new Error(`Lỗi kiểm tra quốc gia: ${err.message}`);
        }
      }
      return true;
    }),
];

// Validate lấy thành phố theo ID
exports.validateGetCityById = [
  param('id')
    .isUUID().withMessage(errorMessages.invalidUUID('ID thành phố'))
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT id FROM cities WHERE id = $1', [value]);
        if (result.rows.length === 0) {
          throw new Error(errorMessages.notFound('Thành phố'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra thành phố: ${err.message}`);
      }
      return true;
    }),
];

// Validate xóa thành phố
exports.validateDeleteCity = [
  param('id')
    .isUUID().withMessage(errorMessages.invalidUUID('ID thành phố'))
    .custom(async (value) => {
      try {
        const result = await pool.query('SELECT id FROM cities WHERE id = $1', [value]);
        if (result.rows.length === 0) {
          throw new Error(errorMessages.notFound('Thành phố'));
        }
      } catch (err) {
        throw new Error(`Lỗi kiểm tra thành phố: ${err.message}`);
      }
      return true;
    }),
];

// Validate lấy tất cả thành phố
exports.validateGetAllCities = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(errorMessages.invalidInt('Trang'))
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(errorMessages.invalidInt('Giới hạn'))
    .toInt(),
  query('country_id')
    .optional()
    .isUUID().withMessage(errorMessages.invalidUUID('ID quốc gia'))
    .custom(async (value) => {
      if (value) {
        try {
          const result = await pool.query('SELECT id FROM countries WHERE id = $1', [value]);
          if (result.rows.length === 0) {
            throw new Error(errorMessages.notFound('Quốc gia'));
          }
        } catch (err) {
          throw new Error(`Lỗi kiểm tra quốc gia: ${err.message}`);
        }
      }
      return true;
    }),
];