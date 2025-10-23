// Cloudinary configuration for image uploads
const cloudinary = require("cloudinary").v2
const logger = require("./logger")

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Verify Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
  logger.warn("Cloudinary credentials not fully configured")
}

module.exports = cloudinary
