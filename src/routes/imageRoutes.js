const express = require("express")
const multer = require("multer")
const { uploadImage, verifyImage, getBinImages, deleteImage } = require("../controllers/imageController")
const { protect, authorize } = require("../middlewares/authMiddleware")
const { iotAuth } = require("../middlewares/iotAuthMiddleware")

const router = express.Router()

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Additional file filter
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

// POST /images/upload - Upload image (admin or IoT)
router.post("/upload", upload.single("image"), (req, res, next) => {
  // Check if request is from admin or IoT device
  if (req.headers["x-api-key"]) {
    // IoT device
    iotAuth(req, res, () => uploadImage(req, res, next))
  } else {
    // Admin user
    protect(req, res, () => uploadImage(req, res, next))
  }
})

// PATCH /images/:imageId/verify - Verify image (admin only)
router.patch("/:imageId/verify", protect, authorize("admin", "manager"), verifyImage)

// GET /images/:binId - Get images for a bin (admin only)
router.get("/:binId", protect, getBinImages)

// DELETE /images/:imageId - Delete image (admin only)
router.delete("/:imageId", protect, authorize("admin"), deleteImage)

module.exports = router
