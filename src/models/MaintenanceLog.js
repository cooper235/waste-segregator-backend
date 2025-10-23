const mongoose = require("mongoose")
const { MAINTENANCE_STATUS } = require("../config/constants")

const maintenanceLogSchema = new mongoose.Schema(
  {
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bin",
      required: [true, "Bin ID is required"],
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
    },
    status: {
      type: String,
      enum: {
        values: Object.values(MAINTENANCE_STATUS),
        message: "Status must be valid",
      },
      default: MAINTENANCE_STATUS.PENDING,
      index: true,
    },
    maintenanceType: {
      type: String,
      enum: {
        values: ["cleaning", "repair", "replacement", "inspection"],
        message: "Maintenance type must be one of: cleaning, repair, replacement, inspection",
      },
      required: [true, "Maintenance type is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    completionDate: {
      type: Date,
      default: null,
    },
    estimatedDuration: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, "Cost cannot be negative"],
    },
    partsReplaced: [String],
  },
  { timestamps: true },
)

maintenanceLogSchema.index({ binId: 1, status: 1 })
maintenanceLogSchema.index({ status: 1, completionDate: -1 })
maintenanceLogSchema.index({ workerId: 1, createdAt: -1 })

module.exports = mongoose.model("MaintenanceLog", maintenanceLogSchema)
