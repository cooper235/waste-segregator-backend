const Bin = require("../models/Bin")
const ImageRecord = require("../models/ImageRecord")
const Alert = require("../models/Alert")
const logger = require("../config/logger")

const anomalyService = {
  // Detect misclassifications and low confidence predictions
  detectClassificationAnomalies: async () => {
    try {
      logger.info("[ANOMALY] Starting classification anomaly detection")

      // Get recent unverified images
      const recentImages = await ImageRecord.find({
        isVerified: false,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      }).populate("binId")

      let anomaliesFound = 0

      for (const image of recentImages) {
        // Check for low confidence predictions
        if (image.confidence < 60) {
          const existingAlert = await Alert.findOne({
            binId: image.binId._id,
            alertType: "anomaly",
            isResolved: false,
            message: { $regex: "low confidence" },
          })

          if (!existingAlert) {
            await Alert.create({
              binId: image.binId._id,
              alertType: "anomaly",
              severity: "medium",
              message: `Low confidence prediction (${image.confidence}%) for category: ${image.predictedCategory}`,
            })
            anomaliesFound++
            logger.warn(`[ANOMALY] Low confidence alert created for bin ${image.binId.binId}`)
          }
        }
      }

      logger.info(`[ANOMALY] Classification anomaly detection completed. Found: ${anomaliesFound}`)
    } catch (error) {
      logger.error(`[ANOMALY] Classification anomaly detection failed: ${error.message}`)
    }
  },

  // Detect bin overflow and overfill conditions
  detectOverflow: async () => {
    try {
      logger.info("[ANOMALY] Starting overflow detection")

      const bins = await Bin.find({ isActive: true })
      let overflowCount = 0

      for (const bin of bins) {
        // Check for overfilled bins (>90% for more than 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

        if (bin.fillLevel > 90 && bin.lastUpdated > oneHourAgo) {
          const existingAlert = await Alert.findOne({
            binId: bin._id,
            alertType: "overfilled",
            isResolved: false,
          })

          if (!existingAlert) {
            await Alert.create({
              binId: bin._id,
              alertType: "overfilled",
              severity: "high",
              message: `Bin ${bin.binId} is overfilled (${bin.fillLevel}%)`,
            })
            overflowCount++
            logger.warn(`[ANOMALY] Overfilled alert created for bin ${bin.binId}`)
          }
        }
      }

      logger.info(`[ANOMALY] Overflow detection completed. Found: ${overflowCount}`)
    } catch (error) {
      logger.error(`[ANOMALY] Overflow detection failed: ${error.message}`)
    }
  },

  // Detect sensor offline conditions
  detectSensorOffline: async () => {
    try {
      logger.info("[ANOMALY] Starting sensor offline detection")

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const bins = await Bin.find({ isActive: true, lastUpdated: { $lt: twoHoursAgo } })

      let offlineCount = 0

      for (const bin of bins) {
        const existingAlert = await Alert.findOne({
          binId: bin._id,
          alertType: "sensor_offline",
          isResolved: false,
        })

        if (!existingAlert) {
          await Alert.create({
            binId: bin._id,
            alertType: "sensor_offline",
            severity: "critical",
            message: `Bin ${bin.binId} sensor has been offline for more than 2 hours`,
          })
          offlineCount++
          logger.error(`[ANOMALY] Sensor offline alert created for bin ${bin.binId}`)
        }
      }

      logger.info(`[ANOMALY] Sensor offline detection completed. Found: ${offlineCount}`)
    } catch (error) {
      logger.error(`[ANOMALY] Sensor offline detection failed: ${error.message}`)
    }
  },

  // Detect maintenance due conditions
  detectMaintenanceDue: async () => {
    try {
      logger.info("[ANOMALY] Starting maintenance due detection")

      const bins = await Bin.find({ isActive: true })
      let maintenanceCount = 0

      for (const bin of bins) {
        if (!bin.maintenanceSchedule.nextMaintenanceDate) {
          continue
        }

        const now = new Date()
        if (bin.maintenanceSchedule.nextMaintenanceDate <= now) {
          const existingAlert = await Alert.findOne({
            binId: bin._id,
            alertType: "maintenance-due",
            isResolved: false,
          })

          if (!existingAlert) {
            await Alert.create({
              binId: bin._id,
              alertType: "maintenance-due",
              severity: "medium",
              message: `Bin ${bin.binId} is due for maintenance (${bin.maintenanceSchedule.frequency})`,
            })
            maintenanceCount++
            logger.warn(`[ANOMALY] Maintenance due alert created for bin ${bin.binId}`)
          }
        }
      }

      logger.info(`[ANOMALY] Maintenance due detection completed. Found: ${maintenanceCount}`)
    } catch (error) {
      logger.error(`[ANOMALY] Maintenance due detection failed: ${error.message}`)
    }
  },

  // Run all anomaly detection checks
  runAllChecks: async () => {
    try {
      logger.info("[ANOMALY] Running all anomaly detection checks")
      await anomalyService.detectClassificationAnomalies()
      await anomalyService.detectOverflow()
      await anomalyService.detectSensorOffline()
      await anomalyService.detectMaintenanceDue()
      logger.info("[ANOMALY] All anomaly detection checks completed")
    } catch (error) {
      logger.error(`[ANOMALY] Error running all checks: ${error.message}`)
    }
  },
}

module.exports = anomalyService
