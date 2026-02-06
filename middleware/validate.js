const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware that checks validation results and returns 400 if there are errors.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

// ============================
// Auth Validators
// ============================

const loginRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ max: 50 }).withMessage('Username too long'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 128 }).withMessage('Password too long'),
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'driver', 'resident']).withMessage('Invalid role'),
  handleValidationErrors
];

const forgotPasswordQuestionRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ max: 50 }).withMessage('Username too long'),
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'driver', 'resident']).withMessage('Invalid role'),
  handleValidationErrors
];

const forgotPasswordVerifyRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required'),
  body('role')
    .trim()
    .isIn(['admin', 'driver', 'resident']).withMessage('Invalid role'),
  body('answer')
    .trim()
    .notEmpty().withMessage('Security answer is required')
    .isLength({ max: 200 }).withMessage('Answer too long'),
  handleValidationErrors
];

const resetPasswordRules = [
  body('resetToken')
    .trim()
    .notEmpty().withMessage('Reset token is required')
    .isHexadecimal().withMessage('Invalid token format'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
  handleValidationErrors
];

// ============================
// User Validators
// ============================

const createUserRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Username can only contain letters, numbers, dots, hyphens, and underscores'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('role')
    .trim()
    .isIn(['admin', 'driver']).withMessage('Role must be admin or driver'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Full name too long'),
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{11}$/).withMessage('Phone number must be 11 digits'),
  handleValidationErrors
];

const updateUserRules = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Full name too long'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[0-9]{11}$/).withMessage('Phone number must be 11 digits'),
  body('password')
    .optional()
    .isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
  handleValidationErrors
];

// ============================
// Truck Validators
// ============================

const createTruckRules = [
  body('truckId')
    .trim()
    .notEmpty().withMessage('Truck ID is required')
    .isLength({ max: 50 }).withMessage('Truck ID too long'),
  body('plateNumber')
    .trim()
    .notEmpty().withMessage('Plate number is required')
    .isLength({ max: 20 }).withMessage('Plate number too long'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Model name too long'),
  body('capacity')
    .optional()
    .isFloat({ min: 0, max: 50000 }).withMessage('Capacity must be 0-50000'),
  body('status')
    .optional()
    .isIn(['available', 'in-use', 'maintenance', 'out-of-service']).withMessage('Invalid status'),
  handleValidationErrors
];

// ============================
// Complaint Validators
// ============================

const submitComplaintRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[0-9+\-() ]{7,20}$/).withMessage('Invalid phone format'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format'),
  body('barangay')
    .trim()
    .notEmpty().withMessage('Barangay is required')
    .isLength({ max: 100 }).withMessage('Barangay name too long'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address too long'),
  body('reportType')
    .trim()
    .notEmpty().withMessage('Report type is required')
    .isIn(['missed_collection', 'overflowing_bin', 'illegal_dumping', 'damaged_bin', 'schedule_issue', 'driver_complaint', 'other'])
    .withMessage('Invalid report type'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description too long'),
  handleValidationErrors
];

// ============================
// GPS Tracking Validators
// ============================

const trackingUpdateRules = [
  body('lat')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('speed')
    .optional()
    .isFloat({ min: 0 }).withMessage('Speed must be non-negative'),
  body('heading')
    .optional()
    .isFloat({ min: 0, max: 360 }).withMessage('Heading must be 0-360'),
  body('routeId')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Route ID too long'),
  handleValidationErrors
];

// ============================
// Schedule Validators
// ============================

const createScheduleRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Schedule name is required')
    .isLength({ max: 200 }).withMessage('Schedule name too long'),
  body('routeId')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Route ID too long'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'biweekly', 'monthly', 'custom']).withMessage('Invalid frequency'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  loginRules,
  forgotPasswordQuestionRules,
  forgotPasswordVerifyRules,
  resetPasswordRules,
  createUserRules,
  updateUserRules,
  createTruckRules,
  submitComplaintRules,
  trackingUpdateRules,
  createScheduleRules
};
