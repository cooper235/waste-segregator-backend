const mongoose = require("mongoose")
const logger = require("./logger")

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    })

    logger.info(`MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

// Handle connection events
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected")
})

mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB error: ${err.message}`)
})

module.exports = connectDB
