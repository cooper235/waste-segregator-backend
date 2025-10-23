const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
require("dotenv").config()

const app = express()

const { securityHeaders, dataSanitization, xssSanitization, preventHpp } = require("./middlewares/securityHeaders")
const { limiter, strictLimiter, rateLimitIoT } = require("./middlewares/rateLimiter")
const errorHandler = require("./middlewares/errorHandler")

app.use(securityHeaders)

app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:3000").split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    maxAge: 86400, // 24 hours
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))

app.use(dataSanitization)
app.use(xssSanitization)
app.use(preventHpp)

app.use(limiter)

// Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running", timestamp: new Date() })
})

app.use("/api/auth", strictLimiter, require("./routes/authRoutes"))
app.use("/api/iot", rateLimitIoT, require("./routes/iotRoutes"))
app.use("/api/bins", require("./routes/binRoutes"))
app.use("/api/images", require("./routes/imageRoutes"))
app.use("/api/commands", require("./routes/commandRoutes"))
app.use("/api/maintenance", require("./routes/maintenanceRoutes"))
app.use("/api/workers", require("./routes/workerRoutes"))
app.use("/api/alerts", require("./routes/alertRoutes"))
app.use("/api/analytics", require("./routes/analyticsRoutes"))
app.use("/api/feedback", require("./routes/feedbackRoutes"))

app.use(errorHandler)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  })
})

module.exports = app
