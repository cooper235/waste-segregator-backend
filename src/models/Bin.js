const mongoose = require("mongoose")
const { WASTE_CATEGORIES, BIN_STATUS } = require("../config/constants")

const binSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: [true, "Please provide a bin ID"],
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: Object.values(WASTE_CATEGORIES),
        message: "Category must be one of: metal, biodegradable, non-biodegradable, others",
      },
      required: [true, "Please specify waste category"],
      index: true,
    },
    location: {
      latitude: {
        type: Number,
        required: [true, "Latitude is required"],
      },
      longitude: {
        type: Number,
        required: [true, "Longitude is required"],
      },
      address: {
        type: String,
        required: [true, "Address is required"],
      },
    },
    status: {
      type: String,
      enum: {
        values: Object.values(BIN_STATUS),
        message: "Status must be one of: active, inactive, maintenance, offline",
      },
      default: BIN_STATUS.ACTIVE,
      index: true,
    },
    fillLevel: {
      type: Number,
      default: 0,
      min: [0, "Fill level cannot be negative"],
      max: [100, "Fill level cannot exceed 100"],
    },
    capacity: {
      type: Number,
      default: 100,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    lastEmptied: {
      type: Date,
      default: null,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    installationDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    maintenanceSchedule: {
      frequency: {
        type: String,
        enum: ["weekly", "biweekly", "monthly", "quarterly"],
        default: "monthly",
      },
      lastMaintenanceDate: Date,
      nextMaintenanceDate: Date,
    },
  },
  { timestamps: true },
)

binSchema.index({ category: 1, status: 1 })
binSchema.index({ isActive: 1, lastUpdated: -1 })
binSchema.index({ status: 1, fillLevel: -1 })

module.exports = mongoose.model("Bin", binSchema)
