const Feedback = require("../models/Feedback")
const mailService = require("../services/mailService")
const logger = require("../config/logger")

// POST /feedback - Submit feedback
exports.submitFeedback = async (req, res, next) => {
  try {
    const { email, subject, message, rating, category } = req.body

    // Validate required fields
    if (!email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "email, subject, and message are required",
      })
    }

    // Validate message length
    if (message.length < 10 || message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 10 and 2000 characters",
      })
    }

    // Create feedback
    const feedback = new Feedback({
      userId: req.user?._id || "anonymous",
      email: email.toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      rating: rating || 3,
      category: category || "general",
    })

    await feedback.save()

    logger.info(`[FEEDBACK] Feedback submitted by ${email}`)

    // Send acknowledgment email to user
    await mailService.sendFeedbackAcknowledgment(email, {
      category: feedback.category,
      rating: feedback.rating,
      message: feedback.message,
    })

    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      await mailService.sendFeedbackNotificationToAdmin(adminEmail, {
        email: feedback.email,
        category: feedback.category,
        rating: feedback.rating,
        subject: feedback.subject,
        message: feedback.message,
      })
    }

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully. Thank you for your input!",
      data: { feedbackId: feedback._id },
    })
  } catch (error) {
    logger.error(`[FEEDBACK] Submit feedback error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to submit feedback" : error.message,
    })
  }
}

// GET /feedback - Get feedback (admin only)
exports.getFeedback = async (req, res, next) => {
  try {
    const { status, category, limit = 50, skip = 0 } = req.query

    // Build query
    const query = {}

    if (status) {
      query.status = status
    }

    if (category) {
      query.category = category
    }

    // Get feedback
    const feedback = await Feedback.find(query)
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .skip(Number.parseInt(skip))

    const total = await Feedback.countDocuments(query)

    logger.info(`[FEEDBACK] Retrieved ${feedback.length} feedback items`)

    res.status(200).json({
      success: true,
      data: {
        feedback,
        pagination: {
          total,
          limit: Number.parseInt(limit),
          skip: Number.parseInt(skip),
        },
      },
    })
  } catch (error) {
    logger.error(`[FEEDBACK] Get feedback error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch feedback" : error.message,
    })
  }
}

// PATCH /feedback/:feedbackId - Review feedback
exports.reviewFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params
    const { status, reviewNotes } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      })
    }

    // Find feedback
    const feedback = await Feedback.findById(feedbackId)
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      })
    }

    // Update feedback
    feedback.status = status
    feedback.reviewedBy = req.user._id
    feedback.reviewNotes = reviewNotes || ""

    await feedback.save()

    logger.info(`[FEEDBACK] Feedback ${feedbackId} reviewed by ${req.user.email}`)

    res.status(200).json({
      success: true,
      message: "Feedback reviewed successfully",
      data: { feedback },
    })
  } catch (error) {
    logger.error(`[FEEDBACK] Review feedback error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to review feedback" : error.message,
    })
  }
}

// GET /feedback/stats - Feedback statistics
exports.getFeedbackStats = async (req, res, next) => {
  try {
    // Get feedback count by category
    const byCategory = await Feedback.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ])

    // Get feedback count by status
    const byStatus = await Feedback.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Get average rating
    const avgRating = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalFeedback: { $sum: 1 },
        },
      },
    ])

    logger.info("[FEEDBACK] Feedback statistics retrieved")

    res.status(200).json({
      success: true,
      data: {
        byCategory,
        byStatus,
        overall: avgRating[0] || { avgRating: 0, totalFeedback: 0 },
      },
    })
  } catch (error) {
    logger.error(`[FEEDBACK] Get feedback stats error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch feedback statistics" : error.message,
    })
  }
}

// DELETE /feedback/:feedbackId - Delete feedback
exports.deleteFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params

    // Find and delete feedback
    const feedback = await Feedback.findByIdAndDelete(feedbackId)
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      })
    }

    logger.info(`[FEEDBACK] Feedback ${feedbackId} deleted`)

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    })
  } catch (error) {
    logger.error(`[FEEDBACK] Delete feedback error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to delete feedback" : error.message,
    })
  }
}
