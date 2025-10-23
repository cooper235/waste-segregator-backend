const logger = require("../config/logger")

// Allowed MIME types for images
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg"]

// Magic bytes for image file validation
const MAGIC_BYTES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
}

// Validate file MIME type
exports.validateMimeType = (mimeType) => {
  return ALLOWED_MIME_TYPES.includes(mimeType)
}

// Validate file magic bytes (file signature)
exports.validateMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 4) {
    return false
  }

  const bytes = Array.from(buffer.slice(0, 4))

  // Check for JPEG
  if (bytes[0] === MAGIC_BYTES.jpeg[0] && bytes[1] === MAGIC_BYTES.jpeg[1] && bytes[2] === MAGIC_BYTES.jpeg[2]) {
    return true
  }

  // Check for PNG
  if (
    bytes[0] === MAGIC_BYTES.png[0] &&
    bytes[1] === MAGIC_BYTES.png[1] &&
    bytes[2] === MAGIC_BYTES.png[2] &&
    bytes[3] === MAGIC_BYTES.png[3]
  ) {
    return true
  }

  return false
}

// Validate file size (max 5MB)
exports.validateFileSize = (fileSize, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return fileSize <= maxSizeBytes
}

// Validate image file
exports.validateImageFile = (file) => {
  const errors = []

  if (!file) {
    errors.push("No file provided")
    return { valid: false, errors }
  }

  // Validate MIME type
  if (!this.validateMimeType(file.mimetype)) {
    errors.push("Invalid file type. Only JPEG and PNG are allowed")
  }

  // Validate file size
  if (!this.validateFileSize(file.size)) {
    errors.push("File size exceeds 5MB limit")
  }

  // Validate magic bytes
  if (!this.validateMagicBytes(file.buffer)) {
    errors.push("File signature does not match image format")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Generate secure filename
exports.generateSecureFilename = (originalName, binId) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split(".").pop().toLowerCase()
  return `${binId}_${timestamp}_${random}.${extension}`
}
