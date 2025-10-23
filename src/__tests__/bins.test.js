/**
 * Bins Endpoints Tests
 * Tests for bin management operations
 */

const request = require("supertest")
const app = require("../app")
const Bin = require("../models/Bin")
const AdminUser = require("../models/AdminUser")

describe("Bins Endpoints", () => {
  let accessToken

  beforeEach(async () => {
    await Bin.deleteMany({})
    await AdminUser.deleteMany({})

    // Create admin user and get token
    const res = await request(app).post("/api/auth/register").send({
      email: "admin@test.com",
      password: "SecurePass123!",
      name: "Admin User",
      role: "admin",
    })

    accessToken = res.body.data.accessToken
  })

  describe("POST /api/bins", () => {
    it("should create a new bin", async () => {
      const res = await request(app).post("/api/bins").set("Authorization", `Bearer ${accessToken}`).send({
        binId: "BIN-001",
        category: "metal",
        location: "Zone A",
        capacity: 100,
      })

      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.binId).toBe("BIN-001")
      expect(res.body.data.category).toBe("metal")
    })

    it("should reject invalid category", async () => {
      const res = await request(app).post("/api/bins").set("Authorization", `Bearer ${accessToken}`).send({
        binId: "BIN-001",
        category: "invalid",
        location: "Zone A",
        capacity: 100,
      })

      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it("should reject duplicate bin ID", async () => {
      await request(app).post("/api/bins").set("Authorization", `Bearer ${accessToken}`).send({
        binId: "BIN-001",
        category: "metal",
        location: "Zone A",
        capacity: 100,
      })

      const res = await request(app).post("/api/bins").set("Authorization", `Bearer ${accessToken}`).send({
        binId: "BIN-001",
        category: "biodegradable",
        location: "Zone B",
        capacity: 100,
      })

      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it("should reject request without authentication", async () => {
      const res = await request(app).post("/api/bins").send({
        binId: "BIN-001",
        category: "metal",
        location: "Zone A",
        capacity: 100,
      })

      expect(res.statusCode).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe("GET /api/bins", () => {
    beforeEach(async () => {
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
        {
          binId: "BIN-003",
          category: "non-biodegradable",
          location: "Zone C",
          capacity: 100,
          fillLevel: 70,
          status: "active",
        },
        {
          binId: "BIN-004",
          category: "others",
          location: "Zone D",
          capacity: 100,
          fillLevel: 20,
          status: "active",
        },
      ])
    })

    it("should retrieve all bins", async () => {
      const res = await request(app).get("/api/bins").set("Authorization", `Bearer ${accessToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBe(4)
    })

    it("should filter bins by category", async () => {
      const res = await request(app).get("/api/bins?category=metal").set("Authorization", `Bearer ${accessToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.every((bin) => bin.category === "metal")).toBe(true)
    })

    it("should support pagination", async () => {
      const res = await request(app).get("/api/bins?page=1&limit=2").set("Authorization", `Bearer ${accessToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.length).toBeLessThanOrEqual(2)
    })
  })

  describe("PATCH /api/bins/:binId", () => {
    beforeEach(async () => {
      await Bin.create({
        binId: "BIN-001",
        category: "metal",
        location: "Zone A",
        capacity: 100,
        fillLevel: 50,
        status: "active",
      })
    })

    it("should update bin details", async () => {
      const res = await request(app).patch("/api/bins/BIN-001").set("Authorization", `Bearer ${accessToken}`).send({
        location: "Zone A Updated",
        capacity: 150,
      })

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.location).toBe("Zone A Updated")
      expect(res.body.data.capacity).toBe(150)
    })

    it("should update bin status", async () => {
      const res = await request(app).patch("/api/bins/BIN-001").set("Authorization", `Bearer ${accessToken}`).send({
        status: "maintenance",
      })

      expect(res.statusCode).toBe(200)
      expect(res.body.data.status).toBe("maintenance")
    })
  })

  describe("DELETE /api/bins/:binId", () => {
    beforeEach(async () => {
      await Bin.create({
        binId: "BIN-001",
        category: "metal",
        location: "Zone A",
        capacity: 100,
        fillLevel: 50,
        status: "active",
      })
    })

    it("should delete a bin", async () => {
      const res = await request(app).delete("/api/bins/BIN-001").set("Authorization", `Bearer ${accessToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)

      const bin = await Bin.findOne({ binId: "BIN-001" })
      expect(bin).toBeNull()
    })
  })
})
