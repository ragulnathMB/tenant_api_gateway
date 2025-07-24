const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateTenantCreation = [
  body('TenantID').notEmpty().withMessage('TenantID is required'),
  body('Name').notEmpty().withMessage('Name is required'),
  body('LicenseCount').optional().isInt({ min: 0 }).withMessage('LicenseCount must be a non-negative integer'),
  body('LicenseType').optional().isString().withMessage('LicenseType must be a string'),
  handleValidationErrors
];

const validateTenantUpdate = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('licenseCount').optional().isInt({ min: 0 }).withMessage('LicenseCount must be a non-negative integer'),
  body('licenseType').optional().isString().withMessage('LicenseType must be a string'),
  body('enabledUsersCount').optional().isInt({ min: 0 }).withMessage('EnabledUsersCount must be a non-negative integer'),
  body('disabledUsersCount').optional().isInt({ min: 0 }).withMessage('DisabledUsersCount must be a non-negative integer'),
  handleValidationErrors
];

module.exports = {
  validateTenantCreation,
  validateTenantUpdate
};
