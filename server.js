const app = require("./src/app")
const connectDB = require("./src/config/database")

const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
})
