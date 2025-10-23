const Bin = require("../models/Bin")
const crypto = require("crypto")

// Get all bins
exports.getAllBins = async (req, res) => {
  try {
    const bins = await Bin.find()
    res.status(200).json({ success: true, count: bins.length, data: bins })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get bin by ID
exports.getBinById = async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id)
    if (!bin) {
      return res.status(404).json({ success: false, message: "Bin not found" })
    }
    res.status(200).json({ success: true, data: bin })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Create new bin
exports.createBin = async (req, res) => {
  try {
    const { binId, category, location, capacity } = req.body

    const bin = await Bin.create({
      binId,
      category,
      location,
      capacity,
      apiKey: crypto.randomBytes(16).toString("hex"),
    })

    res.status(201).json({ success: true, message: "Bin created successfully", data: bin })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update bin
exports.updateBin = async (req, res) => {
  try {
    let bin = await Bin.findById(req.params.id)
    if (!bin) {
      return res.status(404).json({ success: false, message: "Bin not found" })
    }

    bin = await Bin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({ success: true, message: "Bin updated successfully", data: bin })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Delete bin
exports.deleteBin = async (req, res) => {
  try {
    const bin = await Bin.findByIdAndDelete(req.params.id)
    if (!bin) {
      return res.status(404).json({ success: false, message: "Bin not found" })
    }
    res.status(200).json({ success: true, message: "Bin deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
