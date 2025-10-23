const ImageRecord = require("../models/ImageRecord")
const Bin = require("../models/Bin")
const cloudUploadService = require("../services/cloudUploadService")
const { validateImageFile, generateSecureFilename } = require("../utils/fileValidation")
const logger = require("../config/logger")

// POST /images/upload - Upload image (admin or IoT)
exports.uploadImage = async (req, res, next) => {
  try {
    const { binId, predictedCategory } = req.body

    if (!binId) {
      return res.status(400).json({
        success: false,
        message: "binId is required",
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      })
    }

    // Validate image file
    const validation = validateImageFile(req.file)
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "File validation failed",
        errors: validation.errors,
      })
    }

    // Find bin
    const bin = await Bin.findOne({ binId })
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: "Bin not found",
      })
    }

    // Generate secure filename
    const secureFilename = generateSecureFilename(req.file.originalname, binId)

    // Upload to Cloudinary
    let cloudinaryResult
    try {
      cloudinaryResult = await cloudUploadService.uploadImage(req.file.buffer, secureFilename, "waste-segregator/bins")

      logger.info(`[IMAGE] Image uploaded to Cloudinary for bin ${binId}`)
    } catch (cloudinaryError) {
      logger.error(`[IMAGE] Cloudinary upload failed: ${cloudinaryError.message}`)

      // Fallback: Use a placeholder URL if Cloudinary fails
      cloudinaryResult = {
        secure_url: `https://placeholder.com/image?text=Bin+${binId}`,
        public_id: `fallback_${secureFilename}`,
        width: 640,
        height: 480,
        bytes: req.file.size,
        format: req.file.mimetype.split("/")[1],
      }

      logger.warn(`[IMAGE] Using fallback URL for bin ${binId}`)
    }

    // Create image record
    const imageRecord = new ImageRecord({
      binId: bin._id,
      imageUrl: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
      predictedCategory: predictedCategory || bin.category,
      confidence: 85, // Placeholder confidence - would be from ML model
      capturedAt: new Date(),
      imageMetadata: {
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        size: cloudinaryResult.bytes,
        format: cloudinaryResult.format,
      },
    })

    await imageRecord.save()

    logger.info(`[IMAGE] Image record created for bin ${binId}`)

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        imageId: imageRecord._id,
        imageUrl: imageRecord.imageUrl,
        predictedCategory: imageRecord.predictedCategory,
        confidence: imageRecord.confidence,
      },
    })
  } catch (error) {
    logger.error(`[IMAGE] Upload error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Image upload failed" : error.message,
    })
  }
}

// PATCH /images/:imageId/verify - Verify image classification
exports.verifyImage = async (req, res, next) => {
  try {
    const { imageId } = req.params
    const { actualCategory, verificationNotes } = req.body

    if (!actualCategory) {
      return res.status(400).json({
        success: false,
        message: "actualCategory is required",
      })
    }

    // Find image record
    const imageRecord = await ImageRecord.findById(imageId)
    if (!imageRecord) {
      return res.status(404).json({
        success: false,
        message: "Image record not found",
      })
    }

    // Update image record
    imageRecord.actualCategory = actualCategory
    imageRecord.isVerified = true
    imageRecord.verifiedBy = req.user._id
    imageRecord.verificationNotes = verificationNotes || ""

    await imageRecord.save()

    logger.info(`[IMAGE] Image ${imageId} verified by ${req.user.email}`)

    res.status(200).json({
      success: true,
      message: "Image verified successfully",
      data: {
        imageId: imageRecord._id,
        predictedCategory: imageRecord.predictedCategory,
        actualCategory: imageRecord.actualCategory,
        isVerified: imageRecord.isVerified,
      },
    })
  } catch (error) {
    logger.error(`[IMAGE] Verify error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Image verification failed" : error.message,
    })
  }
}

// GET /images/:binId - Get images for a bin
exports.getBinImages = async (req, res, next) => {
  try {
    const { binId } = req.params
    const { limit = 20, skip = 0, isVerified } = req.query

    // Find bin
    const bin = await Bin.findOne({ binId })
    if (!bin) {
      return res.status(404).json({
        success: false,
        message: "Bin not found",
      })
    }

    // Build query
    const query = { binId: bin._id }
    if (isVerified !== undefined) {
      query.isVerified = isVerified === "true"
    }

    // Get images
    const images = await ImageRecord.find(query)
      .sort({ capturedAt: -1 })
      .limit(Number.parseInt(limit))
      .skip(Number.parseInt(skip))

    const total = await ImageRecord.countDocuments(query)

    res.status(200).json({
      success: true,
      data: {
        images,
        pagination: {
          total,
          limit: Number.parseInt(limit),
          skip: Number.parseInt(skip),
        },
      },
    })
  } catch (error) {
    logger.error(`[IMAGE] Get bin images error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Failed to fetch images" : error.message,
    })
  }
}

// DELETE /images/:imageId - Delete image
exports.deleteImage = async (req, res, next) => {
  try {
    const { imageId } = req.params

    // Find image record
    const imageRecord = await ImageRecord.findById(imageId)
    if (!imageRecord) {
      return res.status(404).json({
        success: false,
        message: "Image record not found",
      })
    }

    // Delete from Cloudinary if not fallback
    if (imageRecord.cloudinaryId && !imageRecord.cloudinaryId.startsWith("fallback_")) {
      try {
        await cloudUploadService.deleteImage(imageRecord.cloudinaryId)
        logger.info(`[IMAGE] Image deleted from Cloudinary: ${imageRecord.cloudinaryId}`)
      } catch (cloudinaryError) {
        logger.warn(`[IMAGE] Failed to delete from Cloudinary: ${cloudinaryError.message}`)
      }
    }

    // Delete image record
    await ImageRecord.findByIdAndDelete(imageId)

    logger.info(`[IMAGE] Image record deleted: ${imageId}`)

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    })
  } catch (error) {
    logger.error(`[IMAGE] Delete error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Image deletion failed" : error.message,
    })
  }
}
