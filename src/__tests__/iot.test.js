/**
 * IoT Endpoints Tests
 * Tests for device data updates and command retrieval
 */

const request = require("supertest")
const app = require("../app")
const Bin = require("../models/Bin")
const Command = require("../models/Command")

describe("IoT Endpoints", () => {
  const apiKey = process.env.IOT_API_KEY || "test-api-key-123"

  beforeEach(async () => {
    await Bin.deleteMany({})
    await Command.deleteMany({})

    // Create test bins
    await Bin.create([
      {
        binId: "BIN-001",
        category: "metal",
        location: "Zone A",
        capacity: 100,
        fillLevel: 50,
        status: "active",
      },
      {
        binId: "BIN-002",
        category: "biodegradable",
        location: "Zone B",
        capacity: 100,
        fillLevel: 30,
        status: "active",
      },
    ])
  })

  describe("POST /api/iot/update", () => {
    it("should accept device data update", async () => {
      const res = await request(app).post("/api/iot/update").set("X-API-Key", apiKey).send({
        binId: "BIN-001",
        fillLevel: 75,
        sensorStatus: "ok",
      })

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it("should reject update without API key", async () => {
      const res = await request(app).post("/api/iot/update").send({
        binId: "BIN-001",
        fillLevel: 75,
        sensorStatus: "ok",
      })

      expect(res.statusCode).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it("should reject invalid fill level", async () => {
      const res = await request(app).post("/api/iot/update").set("X-API-Key", apiKey).send({
        binId: "BIN-001",
        fillLevel: 150, // Over 100%
        sensorStatus: "ok",
      })

      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it("should create alert for overfilled bin", async () => {
      await request(app).post("/api/iot/update").set("X-API-Key", apiKey).send({
        binId: "BIN-001",
        fillLevel: 95,
        sensorStatus: "ok",
      })

      const res = await request(app).post("/api/iot/update").set("X-API-Key", apiKey).send({
        binId: "BIN-001",
        fillLevel: 95,
        sensorStatus: "ok",
      })

      expect(res.statusCode).toBe(200)
    })
  })

  describe("GET /api/iot/commands/:binId", () => {
    beforeEach(async () => {
      await Command.create({
        binId: "BIN-001",
        commandType: "empty",
        status: "pending",
      })
    })

    it("should retrieve pending commands for bin", async () => {
      const res = await request(app).get("/api/iot/commands/BIN-001").set("X-API-Key", apiKey)

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
    })

    it("should reject request without API key", async () => {
      const res = await request(app).get("/api/iot/commands/BIN-001")

      expect(res.statusCode).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe("PATCH /api/iot/commands/:commandId/ack", () => {
    let commandId

    beforeEach(async () => {
      const command = await Command.create({
        binId: "BIN-001",
        commandType: "empty",
        status: "pending",
      })
      commandId = command._id
    })

    it("should acknowledge command execution", async () => {
      const res = await request(app).patch(`/api/iot/commands/${commandId}/ack`).set("X-API-Key", apiKey).send({
        status: "executed",
        executedAt: new Date(),
      })

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it("should reject invalid command ID", async () => {
      const res = await request(app).patch("/api/iot/commands/invalid-id/ack").set("X-API-Key", apiKey).send({
        status: "executed",
        executedAt: new Date(),
      })

      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })
})
