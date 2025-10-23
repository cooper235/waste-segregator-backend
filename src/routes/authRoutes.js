const express = require("express")
const {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
  updateProfile,
} = require("../controllers/authController")
const { protect, authorize } = require("../middlewares/authMiddleware")

const router = express.Router()

// Public routes
router.post("/register", register)
router.post("/login", login)
router.post("/refresh-token", refreshToken)

// Protected routes
router.post("/logout", protect, logout)
router.post("/logout-all", protect, logoutAll)
router.get("/me", protect, getCurrentUser)
router.patch("/profile", protect, updateProfile)

module.exports = router
