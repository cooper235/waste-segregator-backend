const express = require("express")
const {
  submitFeedback,
  getFeedback,
  reviewFeedback,
  getFeedbackStats,
  deleteFeedback,
} = require("../controllers/feedbackController")
const { protect, authorize } = require("../middlewares/authMiddleware")

const router = express.Router()

// POST /feedback - Submit feedback (public)
router.post("/", submitFeedback)

// All other feedback routes require authentication
router.use(protect)

// GET /feedback - Get feedback (admin only)
router.get("/", authorize("admin", "manager"), getFeedback)

// GET /feedback/stats - Feedback statistics
router.get("/stats", getFeedbackStats)

// PATCH /feedback/:feedbackId - Review feedback (admin only)
router.patch("/:feedbackId", authorize("admin", "manager"), reviewFeedback)

// DELETE /feedback/:feedbackId - Delete feedback (admin only)
router.delete("/:feedbackId", authorize("admin"), deleteFeedback)

module.exports = router
