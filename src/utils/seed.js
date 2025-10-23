const mongoose = require("mongoose")
require("dotenv").config()

const AdminUser = require("../models/AdminUser")
const Bin = require("../models/Bin")
const Worker = require("../models/Worker")
const ImageRecord = require("../models/ImageRecord")
const Command = require("../models/Command")
const Alert = require("../models/Alert")
const MaintenanceLog = require("../models/MaintenanceLog")
const Feedback = require("../models/Feedback")
const logger = require("../config/logger")

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/waste-segregator", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    logger.info("Connected to MongoDB for seeding")

    // Clear existing data
    await Promise.all([
      AdminUser.deleteMany({}),
      Bin.deleteMany({}),
      Worker.deleteMany({}),
      ImageRecord.deleteMany({}),
      Command.deleteMany({}),
      Alert.deleteMany({}),
      MaintenanceLog.deleteMany({}),
      Feedback.deleteMany({}),
    ])

    logger.info("Cleared existing data")

    const adminUsers = await AdminUser.create([
      {
        name: "Admin User",
        email: "admin@wastemanagement.com",
        password: "Admin@123456",
        role: "admin",
      },
      {
        name: "Manager User",
        email: "manager@wastemanagement.com",
        password: "Manager@123456",
        role: "manager",
      },
      {
        name: "Operator User",
        email: "operator@wastemanagement.com",
        password: "Operator@123456",
        role: "operator",
      },
    ])

    logger.info(`${adminUsers.length} admin users created`)

    const bins = await Bin.create([
      {
        binId: "BIN-001",
        category: "metal",
        location: "Building A - Ground Floor",
        capacity: 100,
        fillLevel: 45,
        status: "active",
        lastUpdated: new Date(),
      },
      {
        binId: "BIN-002",
        category: "biodegradable",
        location: "Building A - First Floor",
        capacity: 100,
        fillLevel: 60,
        status: "active",
        lastUpdated: new Date(),
      },
      {
        binId: "BIN-003",
        category: "non-biodegradable",
        location: "Building B - Ground Floor",
        capacity: 100,
        fillLevel: 30,
        status: "active",
        lastUpdated: new Date(),
      },
      {
        binId: "BIN-004",
        category: "others",
        location: "Building B - First Floor",
        capacity: 100,
        fillLevel: 75,
        status: "active",
        lastUpdated: new Date(),
      },
    ])

    logger.info(`${bins.length} bins created with all 4 waste categories`)

    const workers = await Worker.create([
      {
        name: "John Doe",
        email: "john@wastemanagement.com",
        phone: "+1234567890",
        role: "collector",
        assignedBins: [bins[0]._id, bins[1]._id],
        isActive: true,
        performanceRating: 4.5,
      },
      {
        name: "Jane Smith",
        email: "jane@wastemanagement.com",
        phone: "+0987654321",
        role: "collector",
        assignedBins: [bins[2]._id, bins[3]._id],
        isActive: true,
        performanceRating: 4.8,
      },
      {
        name: "Mike Johnson",
        email: "mike@wastemanagement.com",
        phone: "+1122334455",
        role: "maintenance",
        assignedBins: [bins[0]._id, bins[1]._id, bins[2]._id, bins[3]._id],
        isActive: true,
        performanceRating: 4.3,
      },
    ])

    logger.info(`${workers.length} workers created`)

    const imageRecords = await ImageRecord.create([
      {
        binId: bins[0]._id,
        imageUrl: "https://via.placeholder.com/300?text=Metal+Waste",
        predictedCategory: "metal",
        confidence: 0.95,
        actualCategory: "metal",
        isVerified: true,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        binId: bins[1]._id,
        imageUrl: "https://via.placeholder.com/300?text=Biodegradable",
        predictedCategory: "biodegradable",
        confidence: 0.88,
        actualCategory: "biodegradable",
        isVerified: true,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        binId: bins[2]._id,
        imageUrl: "https://via.placeholder.com/300?text=Non-Biodegradable",
        predictedCategory: "non-biodegradable",
        confidence: 0.92,
        actualCategory: "non-biodegradable",
        isVerified: true,
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        binId: bins[3]._id,
        imageUrl: "https://via.placeholder.com/300?text=Others",
        predictedCategory: "others",
        confidence: 0.75,
        actualCategory: "others",
        isVerified: true,
        timestamp: new Date(),
      },
    ])

    logger.info(`${imageRecords.length} image records created`)

    const commands = await Command.create([
      {
        binId: bins[0]._id,
        commandType: "empty",
        status: "pending",
        description: "Empty the metal waste bin",
        createdAt: new Date(),
      },
      {
        binId: bins[1]._id,
        commandType: "calibrate",
        status: "executed",
        description: "Calibrate biodegradable bin sensors",
        executedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        binId: bins[2]._id,
        commandType: "test",
        status: "pending",
        description: "Test non-biodegradable bin sensors",
      },
    ])

    logger.info(`${commands.length} commands created`)

    const alerts = await Alert.create([
      {
        binId: bins[0]._id,
        alertType: "overflow",
        severity: "high",
        message: "Metal bin is approaching capacity",
        isResolved: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        binId: bins[3]._id,
        alertType: "overflow",
        severity: "critical",
        message: "Others bin is critically full",
        isResolved: false,
        createdAt: new Date(),
      },
      {
        binId: bins[1]._id,
        alertType: "offline",
        severity: "medium",
        message: "Biodegradable bin sensor offline",
        isResolved: true,
        resolvedAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    ])

    logger.info(`${alerts.length} alerts created`)

    const maintenanceLogs = await MaintenanceLog.create([
      {
        binId: bins[0]._id,
        workerId: workers[2]._id,
        maintenanceType: "cleaning",
        status: "completed",
        description: "Regular cleaning and inspection",
        duration: 30,
        cost: 50,
        completionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        binId: bins[2]._id,
        workerId: workers[2]._id,
        maintenanceType: "repair",
        status: "pending",
        description: "Repair sensor malfunction",
        estimatedDuration: 60,
        estimatedCost: 150,
      },
    ])

    logger.info(`${maintenanceLogs.length} maintenance logs created`)

    const feedbackRecords = await Feedback.create([
      {
        category: "feature-request",
        rating: 5,
        message: "Great system! Would love to see real-time notifications for all alerts.",
        email: "user@example.com",
        status: "new",
      },
      {
        category: "bug",
        rating: 2,
        message: "Dashboard sometimes shows incorrect fill levels for bins.",
        email: "user2@example.com",
        status: "in-review",
      },
      {
        category: "general",
        rating: 4,
        message: "The system is working well overall. Keep up the good work!",
        email: "user3@example.com",
        status: "resolved",
      },
    ])

    logger.info(`${feedbackRecords.length} feedback records created`)

    logger.info("Database seeding completed successfully!")
    logger.info("Test Credentials:")
    logger.info("  Admin: admin@wastemanagement.com / Admin@123456")
    logger.info("  Manager: manager@wastemanagement.com / Manager@123456")
    logger.info("  Operator: operator@wastemanagement.com / Operator@123456")
    logger.info("Bins created: BIN-001 (metal), BIN-002 (biodegradable), BIN-003 (non-biodegradable), BIN-004 (others)")

    process.exit(0)
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
}

module.exports = seedDatabase
