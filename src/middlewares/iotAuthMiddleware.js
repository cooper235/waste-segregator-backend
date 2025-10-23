// IoT device authentication using API key
exports.iotAuth = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"]

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API key is required",
      })
    }

    // Verify API key matches environment variable
    if (apiKey !== process.env.IOT_API_KEY) {
      console.warn(`[SECURITY] Invalid IoT API key attempt from IP: ${req.ip}`)
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      })
    }

    req.iotDevice = { authenticated: true }
    next()
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    })
  }
}
