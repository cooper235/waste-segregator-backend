const MaintenanceLog = require("../models/MaintenanceLog")
const Bin = require("../models/Bin")
const Worker = require("../models/Worker")
const logger = require("../config/logger")

// POST /maintenance - Create maintenance log
exports.createMaintenance = async (req, res, next) => {
  try {
    const { binId, maintenanceType, description, workerId, estimatedDuration, cost } = req.body

    if (!binId || !maintenanceType || !description) {
      return res.status(400).json({
        success: false,
        message: "binId, maintenanceType, and description are required",
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

    // Verify worker if provided
    if (workerId) {
      const worker = await Worker.findById(workerId)
      if (!worker) {
        return res.status(404).json({
          success: false,
          message: "Worker not found",
        })
      }
    }

    // Create maintenance log
    const maintenance = new MaintenanceLog({
      binId: bin._id,
      maintenanceType,
      description,
      workerId: workerId || null,
      startDate: new Date(),
      estimatedDuration,
      cost,
    })

    await maintenance.save()

    logger.info(`[MAINTENANCE] Maintenance log created for bin ${binId}`)

    res.status(201).json({
      success: true,
      message: "Maintenance log created successfully",
      data: { maintenance },
    })
  } catch (error) {
    logger.error(`[MAINTENANCE] Create maintenance error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to create maintenance log" : error.message,
    })
  }
}

// GET /maintenance - Get maintenance logs
exports.getMaintenanceLogs = async (req, res, next) => {
  try {
    const { status, binId, workerId, limit = 50, skip = 0 } = req.query

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

    if (workerId) {
      query.workerId = workerId
    }

    // Get maintenance logs
    const logs = await MaintenanceLog.find(query)
      .populate("binId", "binId category location status")
      .populate("workerId", "name email phone role")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .skip(Number.parseInt(skip))

    const total = await MaintenanceLog.countDocuments(query)

    logger.info(`[MAINTENANCE] Retrieved ${logs.length} maintenance logs`)

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit: Number.parseInt(limit),
          skip: Number.parseInt(skip),
        },
      },
    })
  } catch (error) {
    logger.error(`[MAINTENANCE] Get maintenance logs error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch maintenance logs" : error.message,
    })
  }
}

// PATCH /maintenance/:maintenanceId - Update maintenance log
exports.updateMaintenance = async (req, res, next) => {
  try {
    const { maintenanceId } = req.params
    const { status, completionDate, notes, partsReplaced, cost } = req.body

    // Find maintenance log
    const maintenance = await MaintenanceLog.findById(maintenanceId)
    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance log not found",
      })
    }

    // Update fields
    if (status) {
      maintenance.status = status
      if (status === "completed") {
        maintenance.completionDate = completionDate || new Date()
      }
    }

    if (notes) {
      maintenance.notes = notes
    }

    if (partsReplaced) {
      maintenance.partsReplaced = partsReplaced
    }

    if (cost !== undefined) {
      maintenance.cost = cost
    }

    await maintenance.save()

    logger.info(`[MAINTENANCE] Maintenance log ${maintenanceId} updated`)

    res.status(200).json({
      success: true,
      message: "Maintenance log updated successfully",
      data: { maintenance },
    })
  } catch (error) {
    logger.error(`[MAINTENANCE] Update maintenance error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to update maintenance log" : error.message,
    })
  }
}

// DELETE /maintenance/:maintenanceId - Delete maintenance log
exports.deleteMaintenance = async (req, res, next) => {
  try {
    const { maintenanceId } = req.params

    // Find and delete maintenance log
    const maintenance = await MaintenanceLog.findByIdAndDelete(maintenanceId)
    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance log not found",
      })
    }

    logger.info(`[MAINTENANCE] Maintenance log ${maintenanceId} deleted`)

    res.status(200).json({
      success: true,
      message: "Maintenance log deleted successfully",
    })
  } catch (error) {
    logger.error(`[MAINTENANCE] Delete maintenance error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to delete maintenance log" : error.message,
    })
  }
}
