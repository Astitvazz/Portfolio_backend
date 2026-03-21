import express from "express";
import Contact from "../models/Contact.js";
import { sendEmail, sendAutoReply } from "../utils/sendEmail.js";
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

    const contact = await Contact.create({ name, email, subject, message });

    // Send notification email to yourself
    await sendEmail({ name, email, subject, message });

    // Send auto-reply to the user
    await sendAutoReply({ name, email, subject });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Email failed to send" });
  }
});

export default router;