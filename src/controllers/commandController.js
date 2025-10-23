const Command = require("../models/Command")
const Bin = require("../models/Bin")
const commandService = require("../services/commandService")
const logger = require("../config/logger")

// POST /commands - Create command
exports.createCommand = async (req, res, next) => {
  try {
    const { binId, commandType, description, parameters } = req.body

    if (!binId || !commandType) {
      return res.status(400).json({
        success: false,
        message: "binId and commandType are required",
      })
    }

    // Find bin
    const bin = await Bin.findOne({ binId })
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: "Bin not found",
      })
    }

    // Create command
    const command = await commandService.createCommand(bin._id, commandType, req.user._id, description, parameters)

    res.status(201).json({
      success: true,
      message: "Command created successfully",
      data: { command },
    })
  } catch (error) {
    logger.error(`[COMMAND] Create command error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to create command" : error.message,
    })
  }
}

// GET /commands - Get commands with filtering
exports.getCommands = async (req, res, next) => {
  try {
    const { status, binId, limit = 50, skip = 0 } = req.query

    // Build query
    const query = {}

    if (status) {
      query.status = status
    }

    if (binId) {
      const bin = await Bin.findOne({ binId })
      if (bin) {
        query.binId = bin._id
      }
    }

    // Get commands
    const commands = await Command.find(query)
      .populate("binId", "binId category status fillLevel")
      .populate("issuedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .skip(Number.parseInt(skip))

    const total = await Command.countDocuments(query)

    logger.info(`[COMMAND] Retrieved ${commands.length} commands`)

    res.status(200).json({
      success: true,
      data: {
        commands,
        pagination: {
          total,
          limit: Number.parseInt(limit),
          skip: Number.parseInt(skip),
        },
      },
    })
  } catch (error) {
    logger.error(`[COMMAND] Get commands error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch commands" : error.message,
    })
  }
}

// PATCH /commands/:commandId - Update command status
exports.updateCommand = async (req, res, next) => {
  try {
    const { commandId } = req.params
    const { status, failureReason } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      })
    }

    // Find command
    const command = await Command.findById(commandId)
    if (!command) {
      return res.status(404).json({
        success: false,
        message: "Command not found",
      })
    }

    // Update command
    command.status = status
    if (status === "executed") {
      command.executedAt = new Date()
    } else if (status === "failed") {
      command.failureReason = failureReason || "Unknown error"
    }

    await command.save()

    logger.info(`[COMMAND] Command ${commandId} updated to status: ${status}`)

    res.status(200).json({
      success: true,
      message: "Command updated successfully",
      data: { command },
    })
  } catch (error) {
    logger.error(`[COMMAND] Update command error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to update command" : error.message,
    })
  }
}

// DELETE /commands/:commandId - Delete command
exports.deleteCommand = async (req, res, next) => {
  try {
    const { commandId } = req.params

    // Find and delete command
    const command = await Command.findByIdAndDelete(commandId)
    if (!command) {
      return res.status(404).json({
        success: false,
        message: "Command not found",
      })
    }

    logger.info(`[COMMAND] Command ${commandId} deleted`)

    res.status(200).json({
      success: true,
      message: "Command deleted successfully",
    })
  } catch (error) {
    logger.error(`[COMMAND] Delete command error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to delete command" : error.message,
    })
  }
}
