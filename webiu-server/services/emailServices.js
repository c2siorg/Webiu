const nodemailer = require('nodemailer');
const { verifyEmail } = require('../views/emailTemplates/verifyEmail');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASSWORD, // Gmail app-specific password
  },
});

/**
 * Sends an email verification message to the user
 * @param {string} email - The recipient's email address
 * @param {string} verificationToken - The unique token for email verification
 */
const sendVerificationEmail = async (email, verificationToken) => {
  const mailOptions = {
    from: `"Webiu" <${process.env.GMAIL_USER}>`, // Customize sender's name
    to: email,
    subject: 'Verify Your Email Address',
    html: verifyEmail(verificationToken), // Dynamic template rendering with token
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = { sendVerificationEmail };