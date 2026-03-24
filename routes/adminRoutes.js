import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { requireEnv } from "../config/env.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = requireEnv("JWT_SECRET");

    if (!adminEmail || !adminPasswordHash) {
      return res.status(500).json({ message: "Admin credentials are not configured" });
    }

    if (email !== adminEmail) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, adminPasswordHash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email, role: "admin" },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
