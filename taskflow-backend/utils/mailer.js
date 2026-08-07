const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Errors are caught and logged rather than thrown — a failed email
// shouldn't crash the request that triggered it (e.g. registration should
// still succeed even if the OTP email bounces; the user can hit "resend").
const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
};

module.exports = sendEmail;