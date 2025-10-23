const express = require("express")
const {
  createWorker,
  getWorkers,
  updateWorker,
  assignBins,
  getWorkerStats,
  deleteWorker,
} = require("../controllers/workerController")
const { protect, authorize } = require("../middlewares/authMiddleware")

const router = express.Router()

// All worker routes require authentication
router.use(protect)

// POST /workers - Create worker
router.post("/", authorize("admin"), createWorker)

// GET /workers - Get workers
router.get("/", getWorkers)

// GET /workers/:workerId/stats - Get worker statistics
router.get("/:workerId/stats", getWorkerStats)

// PATCH /workers/:workerId - Update worker
router.patch("/:workerId", authorize("admin", "manager"), updateWorker)

// PATCH /workers/:workerId/assign-bins - Assign bins to worker
router.patch("/:workerId/assign-bins", authorize("admin", "manager"), assignBins)

// DELETE /workers/:workerId - Delete worker
router.delete("/:workerId", authorize("admin"), deleteWorker)

module.exports = router
