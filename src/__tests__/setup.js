/**
 * Jest Setup File
 * Configure test environment and database connection
 * Note: Jest globals (beforeAll, afterAll, afterEach) are automatically available
 */

const mongoose = require("mongoose")
const { beforeAll, afterAll, afterEach } = require("@jest/globals")

beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/waste-segregator-test"
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
})

afterAll(async () => {
  // Disconnect from database
  await mongoose.disconnect()
})

afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
})
