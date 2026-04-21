import express from 'express';
import { signup, login, forgotPassword, verifyOtp, resetPassword } from '../services/authService.js';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import dotenv from 'dotenv';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

/* -------- GOOGLE -------- */
router.get("/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res) => {
        const token = jwt.sign(
            {
                id: req.user._id,
                email: req.user.email,
                name: req.user.name || `${req.user.fName || ''} ${req.user.lName || ''}`
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        console.log('Authenticated user:', token);
        res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
    }
);

/* -------- LINKEDIN -------- */
router.get("/linkedin",
  passport.authenticate("linkedin", {
    scope: ["openid", "profile", "email"]
  })
);

router.get("/linkedin/callback",
    passport.authenticate("linkedin", { session: false }),
    (req, res) => {
        const token = jwt.sign(req.user, process.env.JWT_SECRET);

        res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
    }
);

export default router;
