const express = require("express")
const { updateBinData, getCommands, acknowledgeCommand } = require("../controllers/iotController")
const { iotAuth } = require("../middlewares/iotAuthMiddleware")
const { rateLimitIoT } = require("../middlewares/rateLimiter")

const router = express.Router()

// All IoT routes require API key authentication
router.use(iotAuth)
router.use(rateLimitIoT)

// POST /iot/update - Device sends sensor data
router.post("/update", updateBinData)

// GET /iot/commands/:binId - Device retrieves pending commands
router.get("/commands/:binId", getCommands)

// PATCH /iot/commands/:commandId/ack - Device acknowledges command execution
router.patch("/commands/:commandId/ack", acknowledgeCommand)

module.exports = router
