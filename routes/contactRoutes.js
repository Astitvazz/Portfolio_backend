import express from "express";
import Contact from "../models/Contact.js";
import { sendEmail, sendAutoReply, formatMailError } from "../utils/sendEmail.js";
import { contactLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Apply rate limiter to the contact route
router.post("/", contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Prevent very long messages (potential abuse)
    if (message.length > 5000) {
      return res.status(400).json({ error: "Message is too long (max 5000 characters)" });
    }

    await Contact.create({ name, email, subject, message });

    await sendEmail({ name, email, subject, message });

    try {
      await sendAutoReply({ name, email, subject });
    } catch (autoReplyError) {
      console.error("Auto-reply email failed:", formatMailError(autoReplyError));
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact form submission failed:", formatMailError(error));
    res.status(500).json({
      error: "Email failed to send",
      details: error.code || error.message,
    });
  }
});

export default router;
