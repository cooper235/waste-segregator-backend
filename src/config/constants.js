// Waste Categories
const WASTE_CATEGORIES = {
  METAL: "metal",
  BIODEGRADABLE: "biodegradable",
  NON_BIODEGRADABLE: "non-biodegradable",
  OTHERS: "others",
}

// Bin Status
const BIN_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  MAINTENANCE: "maintenance",
  FULL: "full",
}

// Alert Severity
const ALERT_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
}

// Command Types
const COMMAND_TYPES = {
  EMPTY: "empty",
  CALIBRATE: "calibrate",
  RESTART: "restart",
  MAINTENANCE: "maintenance",
}

// Maintenance Status
const MAINTENANCE_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
}

module.exports = {
  WASTE_CATEGORIES,
  BIN_STATUS,
  ALERT_SEVERITY,
  COMMAND_TYPES,
  MAINTENANCE_STATUS,
}
