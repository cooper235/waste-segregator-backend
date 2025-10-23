const express = require("express")
const { createCommand, getCommands, updateCommand, deleteCommand } = require("../controllers/commandController")
const { protect, authorize } = require("../middlewares/authMiddleware")

const router = express.Router()

// All command routes require authentication
router.use(protect)

// POST /commands - Create command
router.post("/", authorize("admin", "manager"), createCommand)

// GET /commands - Get commands
router.get("/", getCommands)

// PATCH /commands/:commandId - Update command
router.patch("/:commandId", authorize("admin", "manager"), updateCommand)

// DELETE /commands/:commandId - Delete command
router.delete("/:commandId", authorize("admin"), deleteCommand)

module.exports = router
