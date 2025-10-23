const Bin = require("../models/Bin")
const ImageRecord = require("../models/ImageRecord")
const Alert = require("../models/Alert")
const Command = require("../models/Command")
const logger = require("../config/logger")

// GET /analytics/waste-count - Waste count by category
exports.getWasteCount = async (req, res, next) => {
  try {
    const { period = "day" } = req.query

    // Calculate date range
    const dateFilter = new Date()
    switch (period) {
      case "week":
        dateFilter.setDate(dateFilter.getDate() - 7)
        break
      case "month":
        dateFilter.setMonth(dateFilter.getMonth() - 1)
        break
      case "day":
      default:
        dateFilter.setDate(dateFilter.getDate() - 1)
    }

    // Aggregate waste count by category
    const wasteCount = await ImageRecord.aggregate([
      {
        $match: {
          capturedAt: { $gte: dateFilter },
          isVerified: true,
        },
      },
      {
        $group: {
          _id: "$actualCategory",
          count: { $sum: 1 },
          avgConfidence: { $avg: "$confidence" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    // Format response for charting
    const categories = wasteCount.map((item) => item._id || "unknown")
    const counts = wasteCount.map((item) => item.count)
    const avgConfidences = wasteCount.map((item) => Math.round(item.avgConfidence || 0))

    logger.info(`[ANALYTICS] Waste count retrieved for period: ${period}`)

    res.status(200).json({
      success: true,
      data: {
        period,
        labels: categories,
        datasets: [
          {
            label: "Waste Count",
            data: counts,
            backgroundColor: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"],
          },
          {
            label: "Avg Confidence",
            data: avgConfidences,
            backgroundColor: ["#95E1D3", "#F38181", "#AA96DA", "#FCBAD3"],
          },
        ],
      },
    })
  } catch (error) {
    logger.error(`[ANALYTICS] Waste count error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch waste count" : error.message,
    })
  }
}

// GET /analytics/trends - Waste trends over time
exports.getTrends = async (req, res, next) => {
  try {
    const { days = 30 } = req.query

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(days))

    // Aggregate daily waste count
    const trends = await ImageRecord.aggregate([
      {
        $match: {
          capturedAt: { $gte: startDate },
          isVerified: true,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$capturedAt" },
          },
          count: { $sum: 1 },
          avgConfidence: { $avg: "$confidence" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])

    // Fill missing dates with zero
    const allDates = []
    for (let i = 0; i < Number.parseInt(days); i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      allDates.push(date.toISOString().split("T")[0])
    }

    const trendMap = {}
    trends.forEach((trend) => {
      trendMap[trend._id] = trend
    })

    const filledTrends = allDates.map((date) => ({
      date,
      count: trendMap[date]?.count || 0,
      avgConfidence: trendMap[date]?.avgConfidence || 0,
    }))

    logger.info(`[ANALYTICS] Trends retrieved for ${days} days`)

    res.status(200).json({
      success: true,
      data: {
        days: Number.parseInt(days),
        labels: filledTrends.map((t) => t.date),
        datasets: [
          {
            label: "Daily Waste Count",
            data: filledTrends.map((t) => t.count),
            borderColor: "#4ECDC4",
            backgroundColor: "rgba(78, 205, 196, 0.1)",
            tension: 0.4,
          },
          {
            label: "Avg Model Accuracy",
            data: filledTrends.map((t) => Math.round(t.avgConfidence)),
            borderColor: "#FF6B6B",
            backgroundColor: "rgba(255, 107, 107, 0.1)",
            tension: 0.4,
          },
        ],
      },
    })
  } catch (error) {
    logger.error(`[ANALYTICS] Trends error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch trends" : error.message,
    })
  }
}

// GET /analytics/bin-status - Bin status overview
exports.getBinStatus = async (req, res, next) => {
  try {
    // Get bin status distribution
    const binStatus = await Bin.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Get fill level distribution
    const fillLevelDistribution = await Bin.aggregate([
      {
        $bucket: {
          groupBy: "$fillLevel",
          boundaries: [0, 25, 50, 75, 100],
          default: "unknown",
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ])

    // Get bins by category
    const binsByCategory = await Bin.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ])

    logger.info("[ANALYTICS] Bin status retrieved")

    res.status(200).json({
      success: true,
      data: {
        status: binStatus,
        fillLevelDistribution,
        byCategory: binsByCategory,
      },
    })
  } catch (error) {
    logger.error(`[ANALYTICS] Bin status error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch bin status" : error.message,
    })
  }
}

// GET /analytics/dashboard/summary - Dashboard summary
exports.getDashboardSummary = async (req, res, next) => {
  try {
    // Get total bins
    const totalBins = await Bin.countDocuments()

    // Get full bins (>80% fill level)
    const fullBins = await Bin.countDocuments({ fillLevel: { $gt: 80 } })

    // Get active bins
    const activeBins = await Bin.countDocuments({ status: "active" })

    // Get offline bins
    const offlineBins = await Bin.countDocuments({ status: "offline" })

    // Get unresolved alerts
    const unresolvedAlerts = await Alert.countDocuments({ isResolved: false })

    // Get critical alerts
    const criticalAlerts = await Alert.countDocuments({
      isResolved: false,
      severity: "critical",
    })

    // Get total images
    const totalImages = await ImageRecord.countDocuments()

    // Get unverified images
    const unverifiedImages = await ImageRecord.countDocuments({ isVerified: false })

    // Get pending commands
    const pendingCommands = await Command.countDocuments({ status: "pending" })

    // Get average fill level
    const avgFillLevel = await Bin.aggregate([
      {
        $group: {
          _id: null,
          avgFill: { $avg: "$fillLevel" },
        },
      },
    ])

    // Get waste distribution
    const wasteDistribution = await Bin.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ])

    logger.info("[ANALYTICS] Dashboard summary retrieved")

    res.status(200).json({
      success: true,
      data: {
        bins: {
          total: totalBins,
          active: activeBins,
          offline: offlineBins,
          full: fullBins,
          avgFillLevel: Math.round(avgFillLevel[0]?.avgFill || 0),
        },
        alerts: {
          unresolved: unresolvedAlerts,
          critical: criticalAlerts,
        },
        images: {
          total: totalImages,
          unverified: unverifiedImages,
        },
        commands: {
          pending: pendingCommands,
        },
        wasteDistribution,
      },
    })
  } catch (error) {
    logger.error(`[ANALYTICS] Dashboard summary error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch dashboard summary" : error.message,
    })
  }
}

// GET /analytics/category-performance - Category classification performance
exports.getCategoryPerformance = async (req, res, next) => {
  try {
    // Get accuracy by category
    const performance = await ImageRecord.aggregate([
      {
        $match: {
          isVerified: true,
        },
      },
      {
        $group: {
          _id: "$predictedCategory",
          total: { $sum: 1 },
          correct: {
            $sum: {
              $cond: [{ $eq: ["$predictedCategory", "$actualCategory"] }, 1, 0],
            },
          },
          avgConfidence: { $avg: "$confidence" },
        },
      },
      {
        $project: {
          category: "$_id",
          total: 1,
          correct: 1,
          accuracy: {
            $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 2],
          },
          avgConfidence: { $round: ["$avgConfidence", 2] },
        },
      },
      {
        $sort: { accuracy: -1 },
      },
    ])

    logger.info("[ANALYTICS] Category performance retrieved")

    res.status(200).json({
      success: true,
      data: {
        performance,
      },
    })
  } catch (error) {
    logger.error(`[ANALYTICS] Category performance error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch category performance" : error.message,
    })
  }
}
