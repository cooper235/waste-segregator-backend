const AdminUser = require("../models/AdminUser")
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashRefreshToken } = require("../utils/jwtUtils")

// Register Admin User (admin only)
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      })
    }

    // Check if user already exists
    const existingUser = await AdminUser.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      })
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      })
    }

    // Create new user
    const user = await AdminUser.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: role || "operator",
    })

    // Generate tokens
    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)
    const hashedRefreshToken = hashRefreshToken(refreshToken)

    // Store hashed refresh token
    await user.addRefreshToken(hashedRefreshToken)

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("[ERROR] Registration error:", error.message)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Registration failed" : error.message,
    })
  }
}

// Login Admin User
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      })
    }

    // Find user and select password field
    const user = await AdminUser.findOne({ email: email.toLowerCase() }).select("+password")

    if (!user) {
      // Generic message to prevent user enumeration
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: "Account is locked. Please try again later",
      })
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      })
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password)

    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts += 1

      // Lock account after 5 failed attempts for 30 minutes
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000)
      }

      await user.save()

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0
    user.lockUntil = null
    user.lastLogin = new Date()
    await user.save()

    // Generate tokens
    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)
    const hashedRefreshToken = hashRefreshToken(refreshToken)

    // Store hashed refresh token
    await user.addRefreshToken(hashedRefreshToken)

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("[ERROR] Login error:", error.message)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Login failed" : error.message,
    })
  }
}

// Refresh access token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      })
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid or expired",
      })
    }

    // Get user
    const user = await AdminUser.findById(decoded.id)
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or account is inactive",
      })
    }

    // Verify refresh token exists in database
    const hashedRefreshToken = require("../utils/jwtUtils").hashRefreshToken(refreshToken)
    if (!user.hasRefreshToken(hashedRefreshToken)) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid",
      })
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id)

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    })
  } catch (error) {
    console.error("[ERROR] Token refresh error:", error.message)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Token refresh failed" : error.message,
    })
  }
}

// Logout
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      })
    }

    // Hash refresh token
    const hashedRefreshToken = require("../utils/jwtUtils").hashRefreshToken(refreshToken)

    // Remove refresh token from database
    await AdminUser.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { token: hashedRefreshToken } },
    })

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("[ERROR] Logout error:", error.message)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Logout failed" : error.message,
    })
  }
}

// Logout from all devices
exports.logoutAll = async (req, res, next) => {
  try {
    // Clear all refresh tokens
    await AdminUser.findByIdAndUpdate(req.user._id, {
      refreshTokens: [],
    })

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully",
    })
  } catch (error) {
    console.error("[ERROR] Logout all error:", error.message)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Logout failed" : error.message,
    })
  }
}

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await AdminUser.findById(req.user._id)

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      },
    })
  } catch (error) {
    console.error("[ERROR] Get current user error:", error.message)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch user" : error.message,
    })
  }
}

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body

    const user = await AdminUser.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true })

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    })
  } catch (error) {
    console.error("[ERROR] Update profile error:", error.message)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Profile update failed" : error.message,
    })
  }
}
