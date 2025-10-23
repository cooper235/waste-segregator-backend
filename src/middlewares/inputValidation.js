/**
 * Input Validation Middleware
 * Comprehensive validation for all request inputs
 */

const { body, param, query, validationResult } = require("express-validator")

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    })
  }
  next()
}

/**
 * Sanitize string inputs
 */
const sanitizeString = (value) => {
  if (typeof value !== "string") return value
  return value.trim().replace(/[<>]/g, "")
}

/**
 * Auth validation schemas
 */
const authValidation = {
  register: [
    body("email").isEmail().normalizeEmail().withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage("Password must contain uppercase, lowercase, number, and special character"),
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters")
      .customSanitizer(sanitizeString),
    body("role").isIn(["admin", "manager", "operator"]).withMessage("Invalid role"),
  ],
  login: [
    body("email").isEmail().normalizeEmail().withMessage("Invalid email format"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  refreshToken: [
    body("refreshToken")
      .notEmpty()
      .withMessage("Refresh token is required")
      .isJWT()
      .withMessage("Invalid token format"),
  ],
}

/**
 * Bin validation schemas
 */
const binValidation = {
  create: [
    body("binId")
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Bin ID must be between 3 and 20 characters")
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage("Bin ID can only contain alphanumeric characters, hyphens, and underscores"),
    body("category")
      .isIn(["metal", "biodegradable", "non-biodegradable", "others"])
      .withMessage("Invalid waste category"),
    body("location")
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage("Location must be between 5 and 100 characters")
      .customSanitizer(sanitizeString),
    body("capacity").isInt({ min: 1, max: 1000 }).withMessage("Capacity must be between 1 and 1000 liters"),
  ],
  update: [
    param("binId").trim().isLength({ min: 3, max: 20 }).withMessage("Invalid bin ID"),
    body("location").optional().trim().isLength({ min: 5, max: 100 }).customSanitizer(sanitizeString),
    body("capacity").optional().isInt({ min: 1, max: 1000 }),
    body("status").optional().isIn(["active", "inactive", "maintenance"]).withMessage("Invalid status"),
  ],
}

/**
 * Image validation schemas
 */
const imageValidation = {
  upload: [
    body("binId").trim().isLength({ min: 3, max: 20 }).withMessage("Invalid bin ID"),
    body("predictedCategory")
      .isIn(["metal", "biodegradable", "non-biodegradable", "others"])
      .withMessage("Invalid predicted category"),
    body("confidence").isFloat({ min: 0, max: 1 }).withMessage("Confidence must be between 0 and 1"),
  ],
  verify: [
    param("imageId").isMongoId().withMessage("Invalid image ID"),
    body("actualCategory")
      .isIn(["metal", "biodegradable", "non-biodegradable", "others"])
      .withMessage("Invalid actual category"),
    body("notes").optional().trim().isLength({ max: 500 }).customSanitizer(sanitizeString),
  ],
}

/**
 * Command validation schemas
 */
const commandValidation = {
  create: [
    body("binId").trim().isLength({ min: 3, max: 20 }).withMessage("Invalid bin ID"),
    body("commandType").isIn(["empty", "calibrate", "reset", "test"]).withMessage("Invalid command type"),
    body("parameters").optional().isObject().withMessage("Parameters must be an object"),
    body("description").optional().trim().isLength({ max: 500 }).customSanitizer(sanitizeString),
  ],
}

/**
 * Worker validation schemas
 */
const workerValidation = {
  create: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters")
      .customSanitizer(sanitizeString),
    body("email").isEmail().normalizeEmail().withMessage("Invalid email format"),
    body("phone")
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .withMessage("Invalid phone number"),
    body("role").isIn(["collector", "maintenance", "supervisor"]).withMessage("Invalid role"),
  ],
}

/**
 * Feedback validation schemas
 */
const feedbackValidation = {
  create: [
    body("category").isIn(["bug", "feature-request", "general", "complaint"]).withMessage("Invalid feedback category"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("message")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Message must be between 10 and 1000 characters")
      .customSanitizer(sanitizeString),
    body("email").optional().isEmail().normalizeEmail(),
  ],
}

/**
 * Pagination validation
 */
const paginationValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
]

module.exports = {
  handleValidationErrors,
  authValidation,
  binValidation,
  imageValidation,
  commandValidation,
  workerValidation,
  feedbackValidation,
  paginationValidation,
}
