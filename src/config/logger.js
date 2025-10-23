// Simple logger utility for consistent logging across the application
const fs = require("fs")
const path = require("path")

const logsDir = path.join(__dirname, "../../logs")

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] INFO: ${message}`)
  },
  error: (message) => {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] ERROR: ${message}`)
  },
  warn: (message) => {
    const timestamp = new Date().toISOString()
    console.warn(`[${timestamp}] WARN: ${message}`)
  },
  debug: (message) => {
    if (process.env.NODE_ENV === "development") {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] DEBUG: ${message}`)
    }
  },
}

module.exports = logger
