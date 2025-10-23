const mongoose = require("mongoose")

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [5, "Subject must be at least 5 characters"],
      maxlength: [100, "Subject cannot exceed 100 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    category: {
      type: String,
      enum: {
        values: ["bug", "feature-request", "general", "complaint"],
        message: "Category must be one of: bug, feature-request, general, complaint",
      },
      default: "general",
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["new", "reviewed", "resolved"],
        message: "Status must be one of: new, reviewed, resolved",
      },
      default: "new",
      index: true,
    },
    attachments: [
      {
        url: String,
        cloudinaryId: String,
      },
    ],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    reviewNotes: {
      type: String,
      maxlength: [500, "Review notes cannot exceed 500 characters"],
    },
  },
  { timestamps: true },
)

feedbackSchema.index({ status: 1, category: 1 })
feedbackSchema.index({ status: 1, createdAt: -1 })
feedbackSchema.index({ category: 1, rating: -1 })

module.exports = mongoose.model("Feedback", feedbackSchema)
