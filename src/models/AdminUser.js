const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const adminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "manager", "operator"],
        message: "Role must be one of: admin, manager, operator",
      },
      default: "operator",
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    phone: {
      type: String,
      match: [/^[0-9]{10,}$/, "Please provide a valid phone number"],
    },
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 604800, // 7 days - auto-delete old tokens
        },
      },
    ],
  },
  { timestamps: true },
)

adminUserSchema.index({ email: 1, isActive: 1 })
adminUserSchema.index({ role: 1, isActive: 1 })

// Hash password before saving
adminUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(Number.parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
adminUserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Method to check if account is locked
adminUserSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now()
}

adminUserSchema.methods.addRefreshToken = async function (hashedToken) {
  this.refreshTokens.push({ token: hashedToken })
  await this.save()
}

adminUserSchema.methods.hasRefreshToken = function (hashedToken) {
  return this.refreshTokens.some((rt) => rt.token === hashedToken)
}

adminUserSchema.methods.removeRefreshToken = async function (hashedToken) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== hashedToken)
  await this.save()
}

adminUserSchema.methods.clearRefreshTokens = async function () {
  this.refreshTokens = []
  await this.save()
}

module.exports = mongoose.model("AdminUser", adminUserSchema)
