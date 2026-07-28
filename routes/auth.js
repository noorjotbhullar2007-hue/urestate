const { sendMessageNotification, sendOTPEmail, sendPasswordResetEmail } = require('../utils/email');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const protect = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
    const { name, email, password, phone, city } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please fill all required fields' });
    }

    try {
        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO users (name, email, password, phone, city, otp, otp_expires, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [name, email, hashedPassword, phone, city, otp, otpExpires, false], async (err, result) => {
            if (err) {
                console.error(err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'This email is already registered. Please login or use a different email.' });
                }
                return res.status(500).json({ message: 'Error registering user', error: err });
            }

            // Send OTP email
//            await sendOTPEmail(email, name, otp);

                res.status(201).json({ 
                    message: 'Registration successful!',
                    email: email
                });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
// LOGIN API
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = results[0];
//              if (!user.is_verified) {
//          return res.status(401).json({ message: 'Please verify your email first. Check your inbox for the OTP code.' });
//    }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

       res.json({ message: 'Login successful!', token, user: { id: user.id, name: user.name, email: user.email, city: user.city } });
    });
});
// GET PROFILE
router.get('/profile', protect, (req, res) => {
    const sql = 'SELECT id, name, email, phone, city, created_at FROM users WHERE id = ?';
    db.query(sql, [req.userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(results[0]);
    });
});
// VERIFY OTP
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];

        // Check if already verified
        if (user.is_verified) {
            return res.status(400).json({ message: 'Email already verified. Please login.' });
        }

        // Check OTP
        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // Check expiry
        if (new Date() > new Date(user.otp_expires)) {
            return res.status(400).json({ message: 'OTP has expired. Please register again.' });
        }

        // Mark as verified
        const updateSql = 'UPDATE users SET is_verified = TRUE, otp = NULL, otp_expires = NULL WHERE email = ?';
        db.query(updateSql, [email], (updateErr) => {
            if (updateErr) return res.status(500).json({ message: 'Error verifying OTP', error: updateErr });
            res.json({ message: 'Email verified successfully! You can now login.' });
        });
    });
});
// FORGOT PASSWORD
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Please provide your email' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        if (results.length === 0) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        const user = results[0];

        // Generate reset token
        const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save token to database
        const updateSql = 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?';
        db.query(updateSql, [resetToken, resetExpires, email], async (updateErr) => {
            if (updateErr) return res.status(500).json({ message: 'Error generating reset token', error: updateErr });

            // Send reset email
            const resetLink = `${process.env.APP_URL}/public/reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;
            await sendPasswordResetEmail(email, user.name, resetLink);

            res.json({ message: 'Password reset link sent to your email!' });
        });
    });
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND reset_token = ?';
    db.query(sql, [email, token], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        if (results.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        const user = results[0];

        // Check expiry
        if (new Date() > new Date(user.reset_token_expires)) {
            return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear token
        const updateSql = 'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?';
        db.query(updateSql, [hashedPassword, email], (updateErr) => {
            if (updateErr) return res.status(500).json({ message: 'Error resetting password', error: updateErr });
            res.json({ message: 'Password reset successfully! You can now login.' });
        });
    });
});
module.exports = router;