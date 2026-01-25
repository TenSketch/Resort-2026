import crypto from 'crypto'
import transporter from '../config/nodemailer.js'
import { EMAIL_VERIFICATION_TEMPLATE, PASSWORD_RESET_EMAIL_TEMPLATE, PASSWORD_ADMIN_SEND_TEMPLATE } from '../config/emailTemplates.js'

// Generate verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Generate password reset token
export const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Send verification email
export const sendVerificationEmail = async (user, token) => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/#/verify-email?token=${token}`
    
    const emailContent = EMAIL_VERIFICATION_TEMPLATE
      .replace(/{{FULL_NAME}}/g, user.name)
      .replace(/{{VERIFICATION_LINK}}/g, verificationLink)

    // Use SENDER_EMAIL if configured, otherwise fall back to SMTP_USER
    const senderEmail = process.env.SENDER_EMAIL 
      ? process.env.SENDER_EMAIL.replace(/'/g, '') 
      : process.env.SMTP_USER

    const mailOptions = {
      from: `"Vanavihari Booking System" <${senderEmail}>`,
      to: user.email,
      subject: 'Verify Your Email - Vanavihari',
      html: emailContent
    }

    console.log(`Attempting to send verification email to ${user.email}...`)
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Verification email sent successfully to ${user.email}`)
    console.log(`Message ID: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message)
    console.error('Full error:', error)
    throw new Error('Failed to send verification email')
  }
}

// Note: Welcome email removed as per requirements
// Users will be redirected to settings page to complete profile after verification

// Send password reset email
export const sendPasswordResetEmail = async (user, token) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/#/forgot-password/${token}`
    
    const emailContent = PASSWORD_RESET_EMAIL_TEMPLATE
      .replace(/{{FULL_NAME}}/g, user.name)
      .replace(/{{RESET_LINK}}/g, resetLink)

    // Use SENDER_EMAIL if configured, otherwise fall back to SMTP_USER
    const senderEmail = process.env.SENDER_EMAIL 
      ? process.env.SENDER_EMAIL.replace(/'/g, '') 
      : process.env.SMTP_USER

    const mailOptions = {
      from: `"Vanavihari Booking System" <${senderEmail}>`,
      to: user.email,
      subject: 'Password Reset Request - Vanavihari',
      html: emailContent
    }

    console.log(`Attempting to send password reset email to ${user.email}...`)
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Password reset email sent successfully to ${user.email}`)
    console.log(`Message ID: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message)
    console.error('Full error:', error)
    throw new Error('Failed to send password reset email')
  }
}

// Send admin-created account credentials email
export const sendAdminCreatedAccountEmail = async (user, plainPassword, isEmailVerified) => {
  try {
    const loginLink = `${process.env.FRONTEND_URL}/#/login`
    const verificationStatus = isEmailVerified ? 'Verified ✓' : 'Not Verified (Please verify your email)'
    
    const emailContent = PASSWORD_ADMIN_SEND_TEMPLATE
      .replace(/{{FULL_NAME}}/g, user.name)
      .replace(/{{EMAIL}}/g, user.email)
      .replace(/{{PASSWORD}}/g, plainPassword)
      .replace(/{{VERIFICATION_STATUS}}/g, verificationStatus)
      .replace(/{{LOGIN_LINK}}/g, loginLink)

    // Use SENDER_EMAIL if configured, otherwise fall back to SMTP_USER
    const senderEmail = process.env.SENDER_EMAIL 
      ? process.env.SENDER_EMAIL.replace(/'/g, '') 
      : process.env.SMTP_USER

    const mailOptions = {
      from: `"Vanavihari Booking System" <${senderEmail}>`,
      to: user.email,
      subject: 'Your Vanavihari Account Credentials',
      html: emailContent
    }

    console.log(`Attempting to send account credentials email to ${user.email}...`)
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Account credentials email sent successfully to ${user.email}`)
    console.log(`Message ID: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('❌ Error sending account credentials email:', error.message)
    console.error('Full error:', error)
    throw new Error('Failed to send account credentials email')
  }
}
