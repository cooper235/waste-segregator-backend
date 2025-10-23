const Bin = require("../models/Bin")
const ImageRecord = require("../models/ImageRecord")
const Command = require("../models/Command")
const Alert = require("../models/Alert")
const commandService = require("../services/commandService")
const logger = require("../config/logger")

// POST /iot/update - Device sends sensor data
exports.updateBinData = async (req, res, next) => {
  try {
    const { binId, fillLevel, sensorStatus, imageUrl } = req.body

    // Validate input
    if (!binId || fillLevel === undefined || !sensorStatus) {
      return res.status(400).json({
        success: false,
        message: "binId, fillLevel, and sensorStatus are required",
      })
    }

    if (fillLevel < 0 || fillLevel > 100) {
      return res.status(400).json({
        success: false,
        message: "fillLevel must be between 0 and 100",
      })
    }

    // Find bin by binId (string identifier)
    const bin = await Bin.findOne({ binId })
    if (!bin) {
      logger.warn(`[IoT] Update attempt for non-existent bin: ${binId}`)
      return res.status(404).json({
        success: false,
        message: "Bin not found",
      })
    }

    // Update bin data
    bin.fillLevel = fillLevel
    bin.lastUpdated = new Date()

    // Update sensor status
    if (sensorStatus !== "OK") {
      bin.status = "offline"
      logger.warn(`[IoT] Bin ${binId} sensor offline: ${sensorStatus}`)
    } else if (bin.status === "offline") {
      bin.status = "active"
    }

    await bin.save()

    // Create image record if imageUrl provided
    if (imageUrl) {
      try {
        const imageRecord = new ImageRecord({
          binId: bin._id,
          imageUrl,
          predictedCategory: bin.category, // Use bin's category as default prediction
          confidence: 85, // Placeholder confidence
          capturedAt: new Date(),
        })
        await imageRecord.save()
        logger.info(`[IoT] Image record created for bin ${binId}`)
      } catch (imageError) {
        logger.error(`[IoT] Failed to create image record: ${imageError.message}`)
        // Don't fail the entire request if image creation fails
      }
    }

    // Check for anomalies
    await checkBinAnomalies(bin)

    res.status(200).json({
      success: true,
      message: "Bin data updated successfully",
      data: {
        binId: bin.binId,
        fillLevel: bin.fillLevel,
        status: bin.status,
        lastUpdated: bin.lastUpdated,
      },
    })
  } catch (error) {
    logger.error(`[IoT] Update bin data error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to update bin data" : error.message,
    })
  }
}

// GET /iot/commands/:binId - Device retrieves pending commands
exports.getCommands = async (req, res, next) => {
  try {
    const { binId } = req.params

    // Find bin by binId
    const bin = await Bin.findOne({ binId })
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: "Bin not found",
      })
    }

    // Get pending commands
    const commands = await commandService.getPendingCommands(bin._id)

    res.status(200).json({
      success: true,
      data: {
        commands: commands.map((cmd) => ({
          id: cmd._id,
          commandType: cmd.commandType,
          parameters: cmd.parameters,
          description: cmd.description,
        })),
      },
    })
  } catch (error) {
    logger.error(`[IoT] Get commands error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch commands" : error.message,
    })
  }
}

// PATCH /iot/commands/:commandId/ack - Device acknowledges command execution
exports.acknowledgeCommand = async (req, res, next) => {
  try {
    const { commandId } = req.params
    const { executedAt, status, failureReason } = req.body

    if (!commandId) {
      return res.status(400).json({
        success: false,
        message: "Command ID is required",
      })
    }

    let command

    if (status === "failed" && failureReason) {
      // Mark command as failed
      command = await commandService.markCommandFailed(commandId, failureReason)
    } else {
      // Mark command as executed
      command = await commandService.markCommandExecuted(commandId, executedAt || new Date())
    }

    res.status(200).json({
      success: true,
      message: "Command acknowledged successfully",
      data: {
        commandId: command._id,
        status: command.status,
        executedAt: command.executedAt,
      },
    })
  } catch (error) {
    logger.error(`[IoT] Acknowledge command error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to acknowledge command" : error.message,
    })
  }
}

// Helper function to check for anomalies
async function checkBinAnomalies(bin) {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now - 60 * 60 * 1000)
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000)

    // Check for overfilled bin
    if (bin.fillLevel > 90 && bin.lastUpdated > oneHourAgo) {
      const existingAlert = await Alert.findOne({
        binId: bin._id,
        alertType: "overfilled",
        isResolved: false,
      })

      if (!existingAlert) {
        const alert = new Alert({
          binId: bin._id,
          alertType: "overfilled",
          severity: "high",
          message: `Bin ${bin.binId} is overfilled (${bin.fillLevel}%)`,
          isResolved: false,
        })
        await alert.save()
        logger.warn(`[ANOMALY] Overfilled alert created for bin ${bin.binId}`)
      }
    }

    // Check for sensor offline
    if (bin.lastUpdated < twoHoursAgo) {
      const existingAlert = await Alert.findOne({
        binId: bin._id,
        alertType: "sensor_offline",
        isResolved: false,
      })

      if (!existingAlert) {
        const alert = new Alert({
          binId: bin._id,
          alertType: "sensor_offline",
          severity: "critical",
          message: `Bin ${bin.binId} sensor has been offline for more than 2 hours`,
          isResolved: false,
        })
        await alert.save()
        logger.error(`[ANOMALY] Sensor offline alert created for bin ${bin.binId}`)
      }
    }
  } catch (error) {
    logger.error(`[ANOMALY] Error checking bin anomalies: ${error.message}`)
  }
}
