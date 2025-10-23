const express = require("express")
const {
  getWasteCount,
  getTrends,
  getBinStatus,
  getDashboardSummary,
  getCategoryPerformance,
} = require("../controllers/analyticsController")
const { protect, authorize } = require("../middlewares/authMiddleware")

const router = express.Router()

// All analytics routes require authentication
router.use(protect)

// GET /analytics/waste-count - Waste count by category
router.get("/waste-count", getWasteCount)

// GET /analytics/trends - Waste trends over time
router.get("/trends", getTrends)

// GET /analytics/bin-status - Bin status overview
router.get("/bin-status", getBinStatus)

// GET /analytics/dashboard/summary - Dashboard summary
router.get("/dashboard/summary", getDashboardSummary)

// GET /analytics/category-performance - Category classification performance
router.get("/category-performance", getCategoryPerformance)

module.exports = router
