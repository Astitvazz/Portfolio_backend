import { requireEnv } from "../config/env.js";

const getEmailConfig = () => ({
  apiKey: requireEnv("BREVO_API_KEY"),
  from: requireEnv("BREVO_FROM_EMAIL"),
  ownerEmail: process.env.CONTACT_TO_EMAIL || requireEnv("ADMIN_EMAIL"),
});

const sendWithBrevo = async ({ to, subject, html, replyTo }) => {
  const { apiKey, from } = getEmailConfig();

  const payload = {
    sender: {
      email: from,
      name: "Astitva",
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  if (replyTo) {
    payload.replyTo = {
      email: replyTo,
    };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(result.message || "Brevo email send failed");
      error.code = `BREVO_${response.status}`;
      error.response = result;
      error.responseCode = response.status;
      throw error;
    }

    return result;
  } catch (error) {
    const wrappedError = new Error("Brevo request failed");
    wrappedError.code = error.code || error.cause?.code || "BREVO_REQUEST_FAILED";
    wrappedError.response = {
      provider: "brevo",
      originalMessage: error.message,
      causeCode: error.cause?.code,
      causeName: error.cause?.name,
    };
    wrappedError.responseCode = error.responseCode;
    throw wrappedError;
  }
};

const sendEmail = async ({ name, email, subject, message }) => {
  const { ownerEmail } = getEmailConfig();

  return sendWithBrevo({
    to: ownerEmail,
    replyTo: email,
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
  });
};

const sendAutoReply = async ({ name, email, subject }) => {
  return sendWithBrevo({
    to: email,
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
  });
};

const formatMailError = (error) => ({
  message: error.message,
  code: error.code,
  response: error.response,
  responseCode: error.responseCode,
  command: error.command,
});

export { sendEmail, sendAutoReply, formatMailError };
