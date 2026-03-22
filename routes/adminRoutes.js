import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('--- Login Attempt ---');
    console.log('Received email:', email);
    console.log('Expected email:', process.env.ADMIN_EMAIL);
    console.log('Email match:', email === process.env.ADMIN_EMAIL);
    console.log('Hash from env:', process.env.ADMIN_PASSWORD_HASH);
    

    if (email !== process.env.ADMIN_EMAIL) {
      console.log('❌ Email mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    console.log('Password match:', passwordMatch);

    if (!passwordMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('=== adminAuth called ===')
    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('Token present:', !!token)
    console.log('Token value:', token?.substring(0, 20) + '...')
    console.log('✅ Login successful');
    
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;