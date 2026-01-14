import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Test email configuration
const testEmail = async () => {
  console.log('Testing email configuration...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'NOT SET');
  console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('---');

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: true, // Enable debug output
    logger: true // Log to console
  });

  try {
    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    // Send test email
    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: `"Vanavihari Test" <${process.env.SENDER_EMAIL.replace(/'/g, '')}>`,
      to: 'official.codewithbalaji@gmail.com', // Using your admin email for testing
      subject: 'Test Email - Vanavihari Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4d9900;">Email Configuration Test</h2>
          <p>This is a test email to verify your Brevo SMTP configuration.</p>
          <p><strong>If you received this email, your SMTP is working correctly!</strong></p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            SMTP User: ${process.env.SMTP_USER}<br>
            Sender Email: ${process.env.SENDER_EMAIL}<br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\n✅ Email configuration is working correctly!');
    console.log('Check your inbox at: official.codewithbalaji@gmail.com');
    
  } catch (error) {
    console.error('❌ Email test failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Authentication failed. Please check:');
      console.error('1. SMTP_USER is correct');
      console.error('2. SMTP_PASS is correct');
      console.error('3. Your Brevo account is active');
    } else if (error.code === 'EENVELOPE') {
      console.error('\n⚠️  Sender email issue. Please check:');
      console.error('1. SENDER_EMAIL is verified in Brevo');
      console.error('2. Email format is correct');
    }
  }

  process.exit(0);
};

testEmail();
