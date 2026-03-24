import nodemailer from "nodemailer";
import { requireEnv } from "../config/env.js";

const getEmailConfig = () => ({
  user: requireEnv("EMAIL_USER"),
  pass: requireEnv("EMAIL_PASS"),
});

// Explicit Gmail SMTP settings are more reliable in production than service aliases.
const createTransporter = () => {
  const { user, pass } = getEmailConfig();

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  });
};

// Send notification email to yourself
const sendEmail = async ({ name, email, subject, message }) => {
  const { user } = getEmailConfig();
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Portfolio Contact" <${user}>`,
    to: user,
    replyTo: email, // allows you to reply directly to the sender
    subject: `New Contact Message: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
          New Message from Portfolio
        </h2>
        <div style="margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #4CAF50;">
            <p style="margin: 0;"><strong>Message:</strong></p>
            <p style="margin: 10px 0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          You can reply directly to this email to respond to ${name}.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send auto-reply to the user
const sendAutoReply = async ({ name, email, subject }) => {
  const { user } = getEmailConfig();
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Astitva" <${user}>`,
    to: email, // send to the person who contacted you
    subject: `Re: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Thank You for Reaching Out!</h2>
        
        <p style="color: #555; line-height: 1.6;">Hi ${name},</p>
        
        <p style="color: #555; line-height: 1.6;">
          Thank you for contacting me! I've received your message regarding "<strong>${subject}</strong>" 
          and I appreciate you taking the time to reach out.
        </p>
        
        <p style="color: #555; line-height: 1.6;">
          I'll review your message and get back to you as soon as possible, typically within 24-48 hours.
        </p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>In the meantime, feel free to:</strong>
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.8;">
            <li>Check out my portfolio at <a href="https://astitva.dev" style="color: #4CAF50;">astitva.dev</a></li>
            <li>Connect with me on <a href="https://linkedin.com/in/yourusername" style="color: #4CAF50;">LinkedIn</a></li>
            <li>Follow me on <a href="https://github.com/yourusername" style="color: #4CAF50;">GitHub</a></li>
          </ul>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          Best regards,<br>
          <strong>Astitva</strong><br>
          <span style="color: #888; font-size: 14px;">Full Stack Developer</span>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated response. Please do not reply to this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const formatMailError = (error) => ({
  message: error.message,
  code: error.code,
  response: error.response,
  responseCode: error.responseCode,
  command: error.command,
});

export { createTransporter, sendEmail, sendAutoReply, formatMailError };
