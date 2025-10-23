const express = require("express")
const {
  createMaintenance,
  getMaintenanceLogs,
  updateMaintenance,
  deleteMaintenance,
} = require("../controllers/maintenanceController")
const { protect, authorize } = require("../middlewares/authMiddleware")

const router = express.Router()

// All maintenance routes require authentication
router.use(protect)

// POST /maintenance - Create maintenance log
router.post("/", authorize("admin", "manager"), createMaintenance)

// GET /maintenance - Get maintenance logs
router.get("/", getMaintenanceLogs)

// PATCH /maintenance/:maintenanceId - Update maintenance log
router.patch("/:maintenanceId", authorize("admin", "manager"), updateMaintenance)

// DELETE /maintenance/:maintenanceId - Delete maintenance log
router.delete("/:maintenanceId", authorize("admin"), deleteMaintenance)

module.exports = router
