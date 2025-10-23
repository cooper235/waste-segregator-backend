const Worker = require("../models/Worker")
const Bin = require("../models/Bin")
const MaintenanceLog = require("../models/MaintenanceLog")
const logger = require("../config/logger")

// POST /workers - Create worker
exports.createWorker = async (req, res, next) => {
  try {
    const { name, email, phone, role, address, emergencyContact } = req.body

    if (!name || !email || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: "name, email, phone, and role are required",
      })
    }

    // Check if worker already exists
    const existingWorker = await Worker.findOne({ email: email.toLowerCase() })
    if (existingWorker) {
      return res.status(409).json({
        success: false,
        message: "Worker with this email already exists",
      })
    }

    // Create worker
    const worker = new Worker({
      name: name.trim(),
      email: email.toLowerCase(),
      phone,
      role,
      address,
      emergencyContact,
    })

    await worker.save()

    logger.info(`[WORKER] Worker created: ${email}`)

    res.status(201).json({
      success: true,
      message: "Worker created successfully",
      data: { worker },
    })
  } catch (error) {
    logger.error(`[WORKER] Create worker error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to create worker" : error.message,
    })
  }
}

// GET /workers - Get workers
exports.getWorkers = async (req, res, next) => {
  try {
    const { role, isActive = true, limit = 50, skip = 0 } = req.query

    // Build query
    const query = {}

    if (role) {
      query.role = role
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true"
    }

    // Get workers
    const workers = await Worker.find(query)
      .populate("assignedBins", "binId category status fillLevel")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .skip(Number.parseInt(skip))

    const total = await Worker.countDocuments(query)

    logger.info(`[WORKER] Retrieved ${workers.length} workers`)

    res.status(200).json({
      success: true,
      data: {
        workers,
        pagination: {
          total,
          limit: Number.parseInt(limit),
          skip: Number.parseInt(skip),
        },
      },
    })
  } catch (error) {
    logger.error(`[WORKER] Get workers error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch workers" : error.message,
    })
  }
}

// PATCH /workers/:workerId - Update worker
exports.updateWorker = async (req, res, next) => {
  try {
    const { workerId } = req.params
    const { name, phone, address, emergencyContact, isActive, performanceRating } = req.body

    // Find worker
    const worker = await Worker.findById(workerId)
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      })
    }

    // Update fields
    if (name) {
      worker.name = name.trim()
    }

    if (phone) {
      worker.phone = phone
    }

    if (address) {
      worker.address = address
    }

    if (emergencyContact) {
      worker.emergencyContact = emergencyContact
    }

    if (isActive !== undefined) {
      worker.isActive = isActive
    }

    if (performanceRating !== undefined) {
      worker.performanceRating = Math.min(5, Math.max(0, performanceRating))
    }

    await worker.save()

    logger.info(`[WORKER] Worker ${workerId} updated`)

    res.status(200).json({
      success: true,
      message: "Worker updated successfully",
      data: { worker },
    })
  } catch (error) {
    logger.error(`[WORKER] Update worker error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to update worker" : error.message,
    })
  }
}

// PATCH /workers/:workerId/assign-bins - Assign bins to worker
exports.assignBins = async (req, res, next) => {
  try {
    const { workerId } = req.params
    const { binIds } = req.body

    if (!binIds || !Array.isArray(binIds)) {
      return res.status(400).json({
        success: false,
        message: "binIds array is required",
      })
    }

    // Find worker
    const worker = await Worker.findById(workerId)
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      })
    }

    // Verify all bins exist
    const bins = await Bin.find({ _id: { $in: binIds } })
    if (bins.length !== binIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more bins not found",
      })
    }

    // Assign bins
    worker.assignedBins = binIds
    await worker.save()

    logger.info(`[WORKER] Assigned ${binIds.length} bins to worker ${workerId}`)

    res.status(200).json({
      success: true,
      message: `${binIds.length} bins assigned successfully`,
      data: { worker },
    })
  } catch (error) {
    logger.error(`[WORKER] Assign bins error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to assign bins" : error.message,
    })
  }
}

// GET /workers/:workerId/stats - Get worker statistics
exports.getWorkerStats = async (req, res, next) => {
  try {
    const { workerId } = req.params

    // Find worker
    const worker = await Worker.findById(workerId)
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      })
    }

    // Get maintenance logs completed by worker
    const completedMaintenance = await MaintenanceLog.countDocuments({
      workerId,
      status: "completed",
    })

    const pendingMaintenance = await MaintenanceLog.countDocuments({
      workerId,
      status: "pending",
    })

    const inProgressMaintenance = await MaintenanceLog.countDocuments({
      workerId,
      status: "in-progress",
    })

    // Get total cost of maintenance
    const costStats = await MaintenanceLog.aggregate([
      { $match: { workerId: worker._id } },
      {
        $group: {
          _id: null,
          totalCost: { $sum: "$cost" },
          avgCost: { $avg: "$cost" },
        },
      },
    ])

    logger.info(`[WORKER] Retrieved stats for worker ${workerId}`)

    res.status(200).json({
      success: true,
      data: {
        worker: {
          id: worker._id,
          name: worker.name,
          role: worker.role,
          performanceRating: worker.performanceRating,
        },
        maintenance: {
          completed: completedMaintenance,
          pending: pendingMaintenance,
          inProgress: inProgressMaintenance,
        },
        costs: costStats[0] || { totalCost: 0, avgCost: 0 },
      },
    })
  } catch (error) {
    logger.error(`[WORKER] Get worker stats error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch worker statistics" : error.message,
    })
  }
}

// DELETE /workers/:workerId - Delete worker
exports.deleteWorker = async (req, res, next) => {
  try {
    const { workerId } = req.params

    // Find and delete worker
    const worker = await Worker.findByIdAndDelete(workerId)
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      })
    }

    logger.info(`[WORKER] Worker ${workerId} deleted`)

    res.status(200).json({
      success: true,
      message: "Worker deleted successfully",
    })
  } catch (error) {
    logger.error(`[WORKER] Delete worker error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to delete worker" : error.message,
    })
  }
}
