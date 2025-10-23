const { celebrate, Joi } = require("celebrate")

// ==================== AUTH VALIDATION ====================
const authValidation = {
  register: celebrate({
    body: Joi.object().keys({
      name: Joi.string().min(2).max(50).required().messages({
        "string.empty": "Name is required",
        "string.min": "Name must be at least 2 characters",
        "string.max": "Name cannot exceed 50 characters",
      }),
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email",
        "string.empty": "Email is required",
      }),
      password: Joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters",
        "string.empty": "Password is required",
      }),
      role: Joi.string().valid("admin", "manager", "operator").default("operator"),
      phone: Joi.string()
        .pattern(/^[0-9]{10,}$/)
        .messages({
          "string.pattern.base": "Please provide a valid phone number",
        }),
    }),
  }),

  login: celebrate({
    body: Joi.object().keys({
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email",
        "string.empty": "Email is required",
      }),
      password: Joi.string().required().messages({
        "string.empty": "Password is required",
      }),
    }),
  }),

  updateProfile: celebrate({
    body: Joi.object().keys({
      name: Joi.string().min(2).max(50),
      phone: Joi.string().pattern(/^[0-9]{10,}$/),
      currentPassword: Joi.string().when("newPassword", {
        is: Joi.exist(),
        then: Joi.required(),
      }),
      newPassword: Joi.string().min(6),
    }),
  }),
}

// ==================== BIN VALIDATION ====================
const binValidation = {
  create: celebrate({
    body: Joi.object().keys({
      binId: Joi.string().required().messages({
        "string.empty": "Bin ID is required",
      }),
      category: Joi.string().valid("metal", "biodegradable", "non-biodegradable", "others").required().messages({
        "any.only": "Category must be one of: metal, biodegradable, non-biodegradable, others",
        "string.empty": "Category is required",
      }),
      location: Joi.object()
        .keys({
          latitude: Joi.number().required().messages({
            "number.base": "Latitude must be a number",
          }),
          longitude: Joi.number().required().messages({
            "number.base": "Longitude must be a number",
          }),
          address: Joi.string().required().messages({
            "string.empty": "Address is required",
          }),
        })
        .required(),
      capacity: Joi.number().min(1).required().messages({
        "number.min": "Capacity must be at least 1",
        "number.base": "Capacity must be a number",
      }),
      maintenanceSchedule: Joi.object().keys({
        frequency: Joi.string().valid("weekly", "biweekly", "monthly", "quarterly"),
      }),
    }),
  }),

  update: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      category: Joi.string().valid("metal", "biodegradable", "non-biodegradable", "others"),
      location: Joi.object().keys({
        latitude: Joi.number(),
        longitude: Joi.number(),
        address: Joi.string(),
      }),
      status: Joi.string().valid("active", "inactive", "maintenance", "offline"),
      fillLevel: Joi.number().min(0).max(100),
      capacity: Joi.number().min(1),
      isActive: Joi.boolean(),
    }),
  }),

  updateFillLevel: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      fillLevel: Joi.number().min(0).max(100).required().messages({
        "number.min": "Fill level cannot be negative",
        "number.max": "Fill level cannot exceed 100",
      }),
    }),
  }),

  getId: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  }),
}

// ==================== IMAGE RECORD VALIDATION ====================
const imageRecordValidation = {
  create: celebrate({
    body: Joi.object().keys({
      binId: Joi.string().required().messages({
        "string.empty": "Bin ID is required",
      }),
      imageUrl: Joi.string().uri().required().messages({
        "string.uri": "Image URL must be a valid URI",
        "string.empty": "Image URL is required",
      }),
      cloudinaryId: Joi.string(),
      predictedCategory: Joi.string().valid("metal", "biodegradable", "non-biodegradable", "others"),
      confidence: Joi.number().min(0).max(100),
      imageMetadata: Joi.object().keys({
        width: Joi.number(),
        height: Joi.number(),
        size: Joi.number(),
        format: Joi.string(),
      }),
    }),
  }),

  verify: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      actualCategory: Joi.string().valid("metal", "biodegradable", "non-biodegradable", "others").required().messages({
        "any.only": "Actual category must be one of: metal, biodegradable, non-biodegradable, others",
        "string.empty": "Actual category is required",
      }),
      verificationNotes: Joi.string().max(500),
    }),
  }),

  getByBin: celebrate({
    params: Joi.object().keys({
      binId: Joi.string().required(),
    }),
    query: Joi.object().keys({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(10),
      isVerified: Joi.boolean(),
    }),
  }),
}

// ==================== COMMAND VALIDATION ====================
const commandValidation = {
  create: celebrate({
    body: Joi.object().keys({
      binId: Joi.string().required().messages({
        "string.empty": "Bin ID is required",
      }),
      commandType: Joi.string().required().messages({
        "string.empty": "Command type is required",
      }),
      description: Joi.string().max(500),
      parameters: Joi.object(),
      maxRetries: Joi.number().min(0).default(3),
    }),
  }),

  update: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      status: Joi.string().valid("pending", "sent", "executed", "failed"),
      failureReason: Joi.string().max(500),
    }),
  }),

  getId: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  }),
}

// ==================== MAINTENANCE LOG VALIDATION ====================
const maintenanceValidation = {
  create: celebrate({
    body: Joi.object().keys({
      binId: Joi.string().required().messages({
        "string.empty": "Bin ID is required",
      }),
      maintenanceType: Joi.string().valid("cleaning", "repair", "replacement", "inspection").required().messages({
        "any.only": "Maintenance type must be one of: cleaning, repair, replacement, inspection",
        "string.empty": "Maintenance type is required",
      }),
      description: Joi.string().max(500).required(),
      startDate: Joi.date().required().messages({
        "date.base": "Start date must be a valid date",
      }),
      estimatedDuration: Joi.number().min(0),
      cost: Joi.number().min(0),
      partsReplaced: Joi.array().items(Joi.string()),
    }),
  }),

  update: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      status: Joi.string().valid("pending", "in-progress", "completed", "cancelled"),
      completionDate: Joi.date(),
      notes: Joi.string().max(1000),
      cost: Joi.number().min(0),
      partsReplaced: Joi.array().items(Joi.string()),
    }),
  }),

  getId: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  }),
}

// ==================== WORKER VALIDATION ====================
const workerValidation = {
  create: celebrate({
    body: Joi.object().keys({
      name: Joi.string().min(2).max(50).required().messages({
        "string.empty": "Name is required",
        "string.min": "Name must be at least 2 characters",
      }),
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email",
        "string.empty": "Email is required",
      }),
      phone: Joi.string()
        .pattern(/^[0-9]{10,}$/)
        .required()
        .messages({
          "string.pattern.base": "Please provide a valid phone number",
          "string.empty": "Phone number is required",
        }),
      role: Joi.string().valid("collector", "maintenance", "supervisor").required().messages({
        "any.only": "Role must be one of: collector, maintenance, supervisor",
        "string.empty": "Role is required",
      }),
      address: Joi.string().max(200),
      emergencyContact: Joi.object().keys({
        name: Joi.string(),
        phone: Joi.string().pattern(/^[0-9]{10,}$/),
      }),
    }),
  }),

  update: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      name: Joi.string().min(2).max(50),
      phone: Joi.string().pattern(/^[0-9]{10,}$/),
      role: Joi.string().valid("collector", "maintenance", "supervisor"),
      isActive: Joi.boolean(),
      address: Joi.string().max(200),
      emergencyContact: Joi.object().keys({
        name: Joi.string(),
        phone: Joi.string().pattern(/^[0-9]{10,}$/),
      }),
      performanceRating: Joi.number().min(0).max(5),
    }),
  }),

  assignBins: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      binIds: Joi.array().items(Joi.string()).required().messages({
        "array.base": "Bin IDs must be an array",
      }),
    }),
  }),

  getId: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  }),
}

// ==================== ALERT VALIDATION ====================
const alertValidation = {
  create: celebrate({
    body: Joi.object().keys({
      binId: Joi.string().required().messages({
        "string.empty": "Bin ID is required",
      }),
      alertType: Joi.string()
        .valid("bin-full", "malfunction", "anomaly", "maintenance-due", "offline")
        .required()
        .messages({
          "any.only": "Alert type must be one of: bin-full, malfunction, anomaly, maintenance-due, offline",
          "string.empty": "Alert type is required",
        }),
      severity: Joi.string().valid("low", "medium", "high", "critical").default("medium"),
      message: Joi.string().max(500).required(),
    }),
  }),

  resolve: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      resolutionNotes: Joi.string().max(500),
      actionTaken: Joi.string(),
    }),
  }),

  getUnresolved: celebrate({
    query: Joi.object().keys({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(10),
      severity: Joi.string().valid("low", "medium", "high", "critical"),
    }),
  }),

  getId: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  }),
}

// ==================== FEEDBACK VALIDATION ====================
const feedbackValidation = {
  create: celebrate({
    body: Joi.object().keys({
      userId: Joi.string().required().messages({
        "string.empty": "User ID is required",
      }),
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email",
        "string.empty": "Email is required",
      }),
      subject: Joi.string().min(5).max(100).required().messages({
        "string.min": "Subject must be at least 5 characters",
        "string.max": "Subject cannot exceed 100 characters",
        "string.empty": "Subject is required",
      }),
      message: Joi.string().min(10).max(2000).required().messages({
        "string.min": "Message must be at least 10 characters",
        "string.max": "Message cannot exceed 2000 characters",
        "string.empty": "Message is required",
      }),
      rating: Joi.number().min(1).max(5),
      category: Joi.string().valid("bug", "feature-request", "general", "complaint").default("general"),
    }),
  }),

  update: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      status: Joi.string().valid("new", "reviewed", "resolved"),
      reviewNotes: Joi.string().max(500),
    }),
  }),

  getAll: celebrate({
    query: Joi.object().keys({
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(10),
      status: Joi.string().valid("new", "reviewed", "resolved"),
      category: Joi.string().valid("bug", "feature-request", "general", "complaint"),
    }),
  }),

  getId: celebrate({
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  }),
}

module.exports = {
  authValidation,
  binValidation,
  imageRecordValidation,
  commandValidation,
  maintenanceValidation,
  workerValidation,
  alertValidation,
  feedbackValidation,
}
