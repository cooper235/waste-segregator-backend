// Custom validators for request data
const { body, param, query } = require("express-validator")

const validators = {
  // Admin registration validation
  validateAdminRegistration: [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("role").isIn(["admin", "manager", "operator"]).withMessage("Invalid role"),
  ],

  // Admin login validation
  validateAdminLogin: [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],

  // Bin creation validation
  validateBinCreation: [
    body("binId").trim().notEmpty().withMessage("Bin ID is required"),
    body("category").isIn(["metal", "biodegradable", "non-biodegradable", "others"]).withMessage("Invalid category"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("capacity").isInt({ min: 1 }).withMessage("Capacity must be a positive number"),
  ],

  // Image record validation
  validateImageRecord: [
    body("binId").isMongoId().withMessage("Invalid bin ID"),
    body("predictedCategory")
      .isIn(["metal", "biodegradable", "non-biodegradable", "others"])
      .withMessage("Invalid category"),
    body("confidence").isFloat({ min: 0, max: 1 }).withMessage("Confidence must be between 0 and 1"),
  ],

  // Command validation
  validateCommand: [
    body("binId").isMongoId().withMessage("Invalid bin ID"),
    body("commandType").isIn(["empty", "lock", "unlock", "reset", "calibrate"]).withMessage("Invalid command type"),
  ],

  // Maintenance log validation
  validateMaintenanceLog: [
    body("binId").isMongoId().withMessage("Invalid bin ID"),
    body("type").isIn(["cleaning", "repair", "inspection", "replacement"]).withMessage("Invalid maintenance type"),
    body("description").trim().notEmpty().withMessage("Description is required"),
  ],

  // Worker validation
  validateWorkerCreation: [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail(),
    body("phone").isMobilePhone().withMessage("Invalid phone number"),
    body("assignedBins").isArray().withMessage("Assigned bins must be an array"),
  ],

  // Feedback validation
  validateFeedback: [
    body("type").isIn(["suggestion", "complaint", "praise"]).withMessage("Invalid feedback type"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("message").trim().notEmpty().withMessage("Message is required"),
  ],

  // Pagination validation
  validatePagination: [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive number"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  ],

  // ID validation
  validateMongoId: [param("id").isMongoId().withMessage("Invalid ID format")],
}

module.exports = validators
