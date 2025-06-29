import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an OTP email with futuristic NeuroNest styling.
 * @param {string} email - Recipient's email address.
 * @param {string} otp - One-time password to be sent.
 */
const sendMail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: 'NeuroNest <otp@neuronest.me>',
      to: [email],
      subject: `Your OTP is ${otp}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; color: #f1f1f1; background-color: #0f0f1b; max-width: 600px; margin: auto; padding: 30px; border-radius: 12px; box-shadow: 0 0 15px #0ff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #00ffff; font-size: 28px; font-weight: bold;">NeuroNest</h1>
            <p style="color: #aaa; font-size: 14px;">Futuristic Learning for the Next Generation</p>
          </div>

          <h2 style="text-align: center; color: #ffffff; font-size: 22px;">OTP Verification</h2>
          <p style="font-size: 16px; color: #ccc;">Hi there,</p>
          <p style="font-size: 16px; color: #ccc;">Please use the following OTP to verify your email address:</p>

          <div style="margin: 20px auto; text-align: center;">
            <span style="display: inline-block; font-size: 28px; font-weight: bold; color: #00ffff; background-color: #1a1a2e; padding: 12px 24px; border-radius: 8px; letter-spacing: 2px; box-shadow: 0 0 10px #00ffff;">
              ${otp}
            </span>
          </div>

          <p style="font-size: 16px; color: #aaa;">If you didn’t request this OTP, you can safely ignore this email.</p>
          <p style="font-size: 16px; color: #aaa;">Thanks,<br/>The NeuroNest Team</p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://neuronest.me" style="display: inline-block; padding: 10px 20px; background-color: #00ffff; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Website</a>
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
