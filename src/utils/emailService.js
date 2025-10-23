const nodemailer = require("nodemailer")

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Send email function
exports.sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email sent to ${to}`)
    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

// Alert notification email template
exports.alertEmailTemplate = (binId, alertType, message) => {
  return `
    <h2>Waste Segregator Alert</h2>
    <p><strong>Bin ID:</strong> ${binId}</p>
    <p><strong>Alert Type:</strong> ${alertType}</p>
    <p><strong>Message:</strong> ${message}</p>
    <p>Please log in to the admin dashboard to take action.</p>
  `
}
