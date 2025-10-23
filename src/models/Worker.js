const mongoose = require("mongoose")

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide worker name"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[0-9]{10,}$/, "Please provide a valid phone number"],
    },
    role: {
      type: String,
      enum: {
        values: ["collector", "maintenance", "supervisor"],
        message: "Role must be one of: collector, maintenance, supervisor",
      },
      required: [true, "Role is required"],
      index: true,
    },
    assignedBins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bin",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    address: {
      type: String,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    emergencyContact: {
      name: String,
      phone: String,
    },
    performanceRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true },
)

workerSchema.index({ role: 1, isActive: 1 })
workerSchema.index({ assignedBins: 1 })

module.exports = mongoose.model("Worker", workerSchema)
