const nodemailer = require("nodemailer")
const logger = require("../config/logger")

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    logger.warn(`[EMAIL] Email service not configured: ${error.message}`)
  } else {
    logger.info("[EMAIL] Email service ready")
  }
})

const mailService = {
  // Send alert notification
  sendAlertNotification: async (adminEmail, alertData) => {
    try {
      const mailOptions = {
        from: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        to: adminEmail,
        subject: `[ALERT] ${alertData.severity.toUpperCase()} - ${alertData.alertType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">Waste Segregator Alert</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
              <p><strong>Alert Type:</strong> ${alertData.alertType}</p>
              <p><strong>Severity:</strong> <span style="color: #d32f2f; font-weight: bold;">${alertData.severity.toUpperCase()}</span></p>
              <p><strong>Bin ID:</strong> ${alertData.binId}</p>
              <p><strong>Message:</strong> ${alertData.message}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">This is an automated alert from the Waste Segregator system.</p>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      logger.info(`[EMAIL] Alert notification sent to ${adminEmail}`)
      return { success: true }
    } catch (error) {
      logger.error(`[EMAIL] Failed to send alert email: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  // Send maintenance reminder
  sendMaintenanceReminder: async (adminEmail, binId, maintenanceData) => {
    try {
      const mailOptions = {
        from: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        to: adminEmail,
        subject: `Maintenance Reminder: Bin ${binId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">Maintenance Reminder</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
              <p><strong>Bin ID:</strong> ${binId}</p>
              <p><strong>Maintenance Type:</strong> ${maintenanceData.maintenanceType}</p>
              <p><strong>Description:</strong> ${maintenanceData.description}</p>
              <p><strong>Estimated Duration:</strong> ${maintenanceData.estimatedDuration || "Not specified"} hours</p>
              <p><strong>Cost:</strong> $${maintenanceData.cost || 0}</p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Please schedule this maintenance at your earliest convenience.</p>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      logger.info(`[EMAIL] Maintenance reminder sent to ${adminEmail}`)
      return { success: true }
    } catch (error) {
      logger.error(`[EMAIL] Failed to send maintenance email: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  // Send feedback acknowledgment
  sendFeedbackAcknowledgment: async (userEmail, feedbackData) => {
    try {
      const mailOptions = {
        from: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        to: userEmail,
        subject: "Thank you for your feedback",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">Thank You for Your Feedback</h2>
            <p>We appreciate your feedback on the Waste Segregator system.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
              <p><strong>Category:</strong> ${feedbackData.category}</p>
              <p><strong>Rating:</strong> ${"⭐".repeat(feedbackData.rating)}</p>
              <p><strong>Your Message:</strong></p>
              <p style="font-style: italic;">"${feedbackData.message}"</p>
            </div>
            <p>Our team will review your feedback and get back to you if necessary.</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Best regards,<br/>Waste Segregator Team</p>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      logger.info(`[EMAIL] Feedback acknowledgment sent to ${userEmail}`)
      return { success: true }
    } catch (error) {
      logger.error(`[EMAIL] Failed to send feedback acknowledgment: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  // Send feedback notification to admin
  sendFeedbackNotificationToAdmin: async (adminEmail, feedbackData) => {
    try {
      const mailOptions = {
        from: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        to: adminEmail,
        subject: `New Feedback: ${feedbackData.category}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">New Feedback Received</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
              <p><strong>From:</strong> ${feedbackData.email}</p>
              <p><strong>Category:</strong> ${feedbackData.category}</p>
              <p><strong>Rating:</strong> ${feedbackData.rating}/5</p>
              <p><strong>Subject:</strong> ${feedbackData.subject}</p>
              <p><strong>Message:</strong></p>
              <p style="font-style: italic;">"${feedbackData.message}"</p>
              <p><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Please review and respond to this feedback in the admin dashboard.</p>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      logger.info(`[EMAIL] Feedback notification sent to admin ${adminEmail}`)
      return { success: true }
    } catch (error) {
      logger.error(`[EMAIL] Failed to send feedback notification: ${error.message}`)
      return { success: false, error: error.message }
    }
  },

  // Send command execution notification
  sendCommandNotification: async (adminEmail, commandData) => {
    try {
      const mailOptions = {
        from: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        to: adminEmail,
        subject: `Command ${commandData.status}: ${commandData.commandType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">Command Status Update</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
              <p><strong>Command Type:</strong> ${commandData.commandType}</p>
              <p><strong>Status:</strong> <span style="font-weight: bold; color: ${commandData.status === "executed" ? "#4caf50" : "#ff9800"};">${commandData.status.toUpperCase()}</span></p>
              <p><strong>Bin ID:</strong> ${commandData.binId}</p>
              <p><strong>Executed At:</strong> ${commandData.executedAt || "Pending"}</p>
              ${commandData.failureReason ? `<p><strong>Failure Reason:</strong> ${commandData.failureReason}</p>` : ""}
            </div>
          </div>
        `,
      }

      await transporter.sendMail(mailOptions)
      logger.info(`[EMAIL] Command notification sent to ${adminEmail}`)
      return { success: true }
    } catch (error) {
      logger.error(`[EMAIL] Failed to send command notification: ${error.message}`)
      return { success: false, error: error.message }
    }
  },
}

module.exports = mailService
