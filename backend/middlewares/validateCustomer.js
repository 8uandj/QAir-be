const { body } = require('express-validator');

exports.validateCreateCustomer = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('birth_date').isISO8601().toDate().withMessage('Invalid birth date'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('identity_number').notEmpty().withMessage('Identity number is required'),
  body('phone_number').notEmpty().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Invalid email'),
  body('address').notEmpty().withMessage('Address is required'),
  body('country').notEmpty().withMessage('Country is required')
];

exports.validateRegister = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').optional(),
  body('username').optional()
];

// Middleware xử lý lỗi validation
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation Errors:', errors.array()); // Thêm log
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};