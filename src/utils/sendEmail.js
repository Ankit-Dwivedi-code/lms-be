import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an OTP email.
 * @param {string} email - Recipient's email address.
 * @param {string} otp - One-time password to be sent.
 */
const sendMail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: 'A2 Pyramid <onboarding@resend.dev>',
      to: email,
      subject: `Your OTP is ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333; font-size: 24px;">A2 Pyramid</h1>
          </div>
          <h2 style="text-align: center; color: #333;">Your OTP Verification</h2>
          <p style="font-size: 16px; color: #555;">Hello,</p>
          <p style="font-size: 16px; color: #555;">Please use the following OTP to verify your email address:</p>
          <p style="font-size: 20px; text-align: center; font-weight: bold; color: #000;">${otp}</p>
          <p style="font-size: 16px; color: #555;">If you did not request this, please ignore this email.</p>
          <p style="font-size: 16px; color: #555;">Thank you,<br>The A2 Pyramid Team</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="https://your-company-website.com" style="text-decoration: none; color: #007bff;">Visit our website</a>
          </div>
        </div>
      `,
    });
    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export { sendMail };
