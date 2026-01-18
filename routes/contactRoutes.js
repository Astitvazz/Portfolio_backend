import express from "express";
import Contact from "../models/Contact.js";
import { sendEmail, sendAutoReply } from "../utils/sendEmail.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
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