const mongoose = require("mongoose")
const { WASTE_CATEGORIES } = require("../config/constants")

const imageRecordSchema = new mongoose.Schema(
  {
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bin",
      required: [true, "Bin ID is required"],
      index: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    cloudinaryId: {
      type: String,
      unique: true,
      sparse: true,
    },
    predictedCategory: {
      type: String,
      enum: {
        values: Object.values(WASTE_CATEGORIES),
        message: "Predicted category must be one of: metal, biodegradable, non-biodegradable, others",
      },
    },
    actualCategory: {
      type: String,
      enum: {
        values: Object.values(WASTE_CATEGORIES),
        message: "Actual category must be one of: metal, biodegradable, non-biodegradable, others",
      },
    },
    confidence: {
      type: Number,
      min: [0, "Confidence cannot be less than 0"],
      max: [100, "Confidence cannot exceed 100"],
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    verificationNotes: {
      type: String,
      maxlength: [500, "Verification notes cannot exceed 500 characters"],
    },
    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    imageMetadata: {
      width: Number,
      height: Number,
      size: Number,
      format: String,
    },
  },
  { timestamps: true },
)

imageRecordSchema.index({ binId: 1, capturedAt: -1 })
imageRecordSchema.index({ isVerified: 1, createdAt: -1 })
imageRecordSchema.index({ predictedCategory: 1, confidence: -1 })

module.exports = mongoose.model("ImageRecord", imageRecordSchema)
