const express = require('express');
const router = express.Router();
const db = require('../config/db');
const protect = require('../middleware/authMiddleware');

// SEND MESSAGE (protected)
router.post('/send', protect, (req, res) => {
    const { property_id, receiver_id, message } = req.body;
    const sender_id = req.userId;

    if (!property_id || !receiver_id || !message) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    if (sender_id === receiver_id) {
        return res.status(400).json({ message: 'You cannot message yourself' });
    }

    const sql = 'INSERT INTO messages (property_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)';
    db.query(sql, [property_id, sender_id, receiver_id, message], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error sending message', error: err });
        res.status(201).json({ message: 'Message sent successfully!' });
    });
});

// GET ALL CONVERSATIONS (for dashboard - messages received)
router.get('/conversations', protect, (req, res) => {
    const userId = req.userId;

    const sql = `
        SELECT m.*, 
        u.name as sender_name, u.phone as sender_phone,
        p.title as property_title,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = FALSE) as unread_count
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        JOIN properties p ON m.property_id = p.id
        WHERE m.receiver_id = ?
        ORDER BY m.created_at DESC
    `;

    db.query(sql, [userId, userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching conversations', error: err });
        res.json(results);
    });
});

// GET SENT MESSAGES (messages sent by logged in user)
router.get('/sent', protect, (req, res) => {
    const userId = req.userId;

    const sql = `
        SELECT m.*, 
        u.name as receiver_name,
        p.title as property_title
        FROM messages m
        JOIN users u ON m.receiver_id = u.id
        JOIN properties p ON m.property_id = p.id
        WHERE m.sender_id = ?
        ORDER BY m.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching sent messages', error: err });
        res.json(results);
    });
});

// REPLY TO MESSAGE (protected)
router.post('/reply', protect, (req, res) => {
    const { property_id, receiver_id, message } = req.body;
    const sender_id = req.userId;

    if (!property_id || !receiver_id || !message) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    const sql = 'INSERT INTO messages (property_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)';
    db.query(sql, [property_id, sender_id, receiver_id, message], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error sending reply', error: err });
        res.status(201).json({ message: 'Reply sent successfully!' });
    });
});

// MARK MESSAGES AS READ
router.put('/read/:senderId/:propertyId', protect, (req, res) => {
    const { senderId, propertyId } = req.params;
    const userId = req.userId;

    const sql = 'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND property_id = ? AND receiver_id = ?';
    db.query(sql, [senderId, propertyId, userId], (err) => {
        if (err) return res.status(500).json({ message: 'Error marking messages as read', error: err });
        res.json({ message: 'Messages marked as read' });
    });
});

// GET UNREAD COUNT (for notification badge)
router.get('/unread', protect, (req, res) => {
    const userId = req.userId;

    const sql = 'SELECT COUNT(*) as unread_count FROM messages WHERE receiver_id = ? AND is_read = FALSE';
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching unread count', error: err });
        res.json(results[0]);
    });
});

module.exports = router;