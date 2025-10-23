// Middleware to verify IoT device API key
exports.verifyIoTKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"]

  if (!apiKey) {
    return res.status(401).json({ success: false, message: "API key is required" })
  }

  if (apiKey !== process.env.IOT_API_KEY) {
    return res.status(403).json({ success: false, message: "Invalid API key" })
  }

  next()
}
