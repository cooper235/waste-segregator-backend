const mongoose = require("mongoose")
const { COMMAND_TYPES } = require("../config/constants")

const commandSchema = new mongoose.Schema(
  {
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bin",
      required: [true, "Bin ID is required"],
      index: true,
    },
    commandType: {
      type: String,
      enum: {
        values: Object.values(COMMAND_TYPES),
        message: "Command type must be valid",
      },
      required: [true, "Command type is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "sent", "executed", "failed"],
        message: "Status must be one of: pending, sent, executed, failed",
      },
      default: "pending",
      index: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: [true, "Issued by admin user is required"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    executedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      maxlength: [500, "Failure reason cannot exceed 500 characters"],
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true },
)

commandSchema.index({ binId: 1, status: 1 })
commandSchema.index({ status: 1, createdAt: -1 })
commandSchema.index({ issuedBy: 1, createdAt: -1 })

module.exports = mongoose.model("Command", commandSchema)
