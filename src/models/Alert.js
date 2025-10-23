const mongoose = require("mongoose")
const { ALERT_SEVERITY } = require("../config/constants")

const alertSchema = new mongoose.Schema(
  {
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bin",
      required: [true, "Bin ID is required"],
      index: true,
    },
    alertType: {
      type: String,
      enum: {
        values: ["bin-full", "malfunction", "anomaly", "maintenance-due", "offline", "overfilled", "sensor_offline"],
        message: "Alert type must be valid",
      },
      required: [true, "Alert type is required"],
    },
    severity: {
      type: String,
      enum: {
        values: Object.values(ALERT_SEVERITY),
        message: "Severity must be valid",
      },
      default: ALERT_SEVERITY.MEDIUM,
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    resolutionNotes: {
      type: String,
      maxlength: [500, "Resolution notes cannot exceed 500 characters"],
    },
    actionTaken: String,
  },
  { timestamps: true },
)

alertSchema.index({ binId: 1, isResolved: 1 })
alertSchema.index({ isResolved: 1, severity: 1, createdAt: -1 })
alertSchema.index({ severity: 1, createdAt: -1 })

module.exports = mongoose.model("Alert", alertSchema)
