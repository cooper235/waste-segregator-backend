const Command = require("../models/Command")
const Bin = require("../models/Bin")
const logger = require("../config/logger")

const commandService = {
  // Create and queue command for device
  createCommand: async (binId, commandType, issuedBy, description = "", parameters = {}) => {
    try {
      // Verify bin exists
      const bin = await Bin.findById(binId)
      if (!bin) {
        throw new Error("Bin not found")
      }

      const command = new Command({
        binId,
        commandType,
        issuedBy,
        description,
        parameters,
        status: "pending",
      })

      await command.save()
      logger.info(`[COMMAND] Created command ${command._id} for bin ${binId}: ${commandType}`)
      return command
    } catch (error) {
      logger.error(`[COMMAND] Failed to create command: ${error.message}`)
      throw error
    }
  },

  // Get pending commands for a bin
  getPendingCommands: async (binId) => {
    try {
      const commands = await Command.find({
        binId,
        status: "pending",
      })
        .sort({ createdAt: 1 })
        .limit(10)

      return commands
    } catch (error) {
      logger.error(`[COMMAND] Failed to fetch pending commands: ${error.message}`)
      throw error
    }
  },

  // Mark command as executed
  markCommandExecuted: async (commandId, executedAt = new Date()) => {
    try {
      const command = await Command.findByIdAndUpdate(
        commandId,
        {
          status: "executed",
          executedAt,
        },
        { new: true },
      )

      if (!command) {
        throw new Error("Command not found")
      }

      logger.info(`[COMMAND] Command ${commandId} marked as executed`)
      return command
    } catch (error) {
      logger.error(`[COMMAND] Failed to mark command executed: ${error.message}`)
      throw error
    }
  },

  // Mark command as failed
  markCommandFailed: async (commandId, failureReason) => {
    try {
      const command = await Command.findById(commandId)
      if (!command) {
        throw new Error("Command not found")
      }

      // Increment retry count
      command.retryCount += 1

      // If retries exceeded, mark as failed
      if (command.retryCount >= command.maxRetries) {
        command.status = "failed"
        command.failureReason = failureReason
      } else {
        command.status = "pending" // Reset to pending for retry
      }

      await command.save()
      logger.warn(
        `[COMMAND] Command ${commandId} failed (attempt ${command.retryCount}/${command.maxRetries}): ${failureReason}`,
      )
      return command
    } catch (error) {
      logger.error(`[COMMAND] Failed to mark command failed: ${error.message}`)
      throw error
    }
  },

  // Get command by ID
  getCommandById: async (commandId) => {
    try {
      const command = await Command.findById(commandId).populate("binId issuedBy")
      return command
    } catch (error) {
      logger.error(`[COMMAND] Failed to fetch command: ${error.message}`)
      throw error
    }
  },

  // Get all commands for a bin
  getBinCommands: async (binId, status = null) => {
    try {
      const query = { binId }
      if (status) {
        query.status = status
      }

      const commands = await Command.find(query).sort({ createdAt: -1 }).limit(50)
      return commands
    } catch (error) {
      logger.error(`[COMMAND] Failed to fetch bin commands: ${error.message}`)
      throw error
    }
  },
}

module.exports = commandService
