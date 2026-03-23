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

    console.log("--- Login Attempt ---");
    console.log("Received email:", email);
    console.log("Expected email:", adminEmail);
    console.log("Email match:", email === adminEmail);
    console.log("Hash from env present:", !!adminPasswordHash);

    if (!adminEmail || !adminPasswordHash) {
      return res.status(500).json({ message: "Admin credentials are not configured" });
    }

    if (email !== adminEmail) {
      console.log("Email mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, adminPasswordHash);
    console.log("Password match:", passwordMatch);

    if (!passwordMatch) {
      console.log("Password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email, role: "admin" },
      jwtSecret,
      { expiresIn: "7d" }
    );

    console.log("Token present:", !!token);
    console.log("Token value:", token?.substring(0, 20) + "...");
    console.log("Login successful");

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
