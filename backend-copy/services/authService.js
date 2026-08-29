import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'livekit_studio_jwt_secret_change_me_in_prod';
const JWT_EXPIRES = '7d';

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No account found with that email' });

    const otp = String(crypto.randomInt(100000, 999999));
    user.resetToken       = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    // Send email via Resend if API key is set, otherwise log to console
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: user.email,
        subject: 'Your password reset code',
        text: `Your reset code is: ${otp}\n\nThis code expires in 15 minutes.`,
      });
    } else {
      console.log(`[DEV] Password reset OTP for ${user.email}: ${otp}`);
    }

    res.json({ success: true, message: 'Reset code sent' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ error: 'Failed to send reset code' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'email and otp are required' });

    const hashed = crypto.createHash('sha256').update(otp).digest('hex');
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetToken: hashed,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired code' });

    res.json({ success: true });
  } catch (err) {
    console.error('verifyOtp error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ error: 'email, otp and newPassword are required' });

    const hashed = crypto.createHash('sha256').update(otp).digest('hex');
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetToken: hashed,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired code' });

    user.password         = await bcrypt.hash(newPassword, 10);
    user.resetToken       = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

export const signup = async (req, res) => {
  try {
    const { fName, lName, email, password, phoneNumber } = req.body;
    if (!fName || !lName || !email || !password || !phoneNumber) {
      return res.status(400).json({ error: 'All fields are required: fName, lName, email, password, phoneNumber' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fName,
      lName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phoneNumber,
    });
    const token = signToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
};
