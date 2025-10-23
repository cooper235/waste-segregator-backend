const express = require("express")
const { getAllBins, getBinById, createBin, updateBin, deleteBin } = require("../controllers/binController")
const { protect, authorize } = require("../middlewares/auth")

const router = express.Router()

router.get("/", protect, getAllBins)
router.get("/:id", protect, getBinById)
router.post("/", protect, authorize("admin", "manager"), createBin)
router.put("/:id", protect, authorize("admin", "manager"), updateBin)
router.delete("/:id", protect, authorize("admin"), deleteBin)

module.exports = router
