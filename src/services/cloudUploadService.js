// Service for uploading images to Cloudinary
const cloudinary = require("../config/cloudinary")
const logger = require("../config/logger")

const cloudUploadService = {
  // Upload image buffer to Cloudinary
  uploadImage: async (fileBuffer, fileName, folder = "waste-segregator") => {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "auto",
            public_id: fileName,
          },
          (error, result) => {
            if (error) {
              logger.error(`Cloudinary upload failed: ${error.message}`)
              reject(error)
            } else {
              logger.info(`Image uploaded to Cloudinary: ${result.public_id}`)
              resolve(result)
            }
          },
        )

        uploadStream.end(fileBuffer)
      })
    } catch (error) {
      logger.error(`Upload service error: ${error.message}`)
      throw error
    }
  },

  // Delete image from Cloudinary
  deleteImage: async (publicId) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      logger.info(`Image deleted from Cloudinary: ${publicId}`)
      return result
    } catch (error) {
      logger.error(`Failed to delete image: ${error.message}`)
      throw error
    }
  },

  // Get image URL
  getImageUrl: (publicId) => {
    return cloudinary.url(publicId, {
      secure: true,
      quality: "auto",
      fetch_format: "auto",
    })
  },
}

module.exports = cloudUploadService
