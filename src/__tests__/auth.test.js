/**
 * Authentication Tests
 * Tests for register, login, refresh token, and logout endpoints
 */

const request = require("supertest")
const app = require("../app")
const AdminUser = require("../models/AdminUser")

describe("Authentication Endpoints", () => {
  beforeEach(async () => {
    await AdminUser.deleteMany({})
  })

  describe("POST /api/auth/register", () => {
    it("should register a new admin user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "admin@test.com",
        password: "SecurePass123!",
        name: "Admin User",
        role: "admin",
      })

      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty("accessToken")
      expect(res.body.data).toHaveProperty("refreshToken")
    })

    it("should reject weak passwords", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "admin@test.com",
        password: "weak",
        name: "Admin User",
        role: "admin",
      })

      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it("should reject invalid email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "invalid-email",
        password: "SecurePass123!",
        name: "Admin User",
        role: "admin",
      })

      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it("should reject duplicate email", async () => {
      await request(app).post("/api/auth/register").send({
        email: "admin@test.com",
        password: "SecurePass123!",
        name: "Admin User",
        role: "admin",
      })

      const res = await request(app).post("/api/auth/register").send({
        email: "admin@test.com",
        password: "SecurePass123!",
        name: "Another Admin",
        role: "admin",
      })

      expect(res.statusCode).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        email: "admin@test.com",
        password: "SecurePass123!",
        name: "Admin User",
        role: "admin",
      })
    })

    it("should login with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "admin@test.com",
        password: "SecurePass123!",
      })

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty("accessToken")
      expect(res.body.data).toHaveProperty("refreshToken")
    })

    it("should reject incorrect password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "admin@test.com",
        password: "WrongPassword123!",
      })

      expect(res.statusCode).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it("should reject non-existent user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@test.com",
        password: "SecurePass123!",
      })

      expect(res.statusCode).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe("POST /api/auth/refresh", () => {
    let refreshToken

    beforeEach(async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "admin@test.com",
        password: "SecurePass123!",
        name: "Admin User",
        role: "admin",
      })

      refreshToken = res.body.data.refreshToken
    })

    it("should refresh access token with valid refresh token", async () => {
      const res = await request(app).post("/api/auth/refresh").send({ refreshToken })

      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty("accessToken")
    })

    it("should reject invalid refresh token", async () => {
      const res = await request(app).post("/api/auth/refresh").send({ refreshToken: "invalid-token" })

      expect(res.statusCode).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })
})
