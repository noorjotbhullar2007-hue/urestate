const express = require('express');
const router = express.Router();
const db = require('../config/db');
const protect = require('../middleware/authMiddleware');

// Admin check middleware
const adminOnly = (req, res, next) => {
    const adminId = req.userId;
    const sql = 'SELECT * FROM users WHERE id = ? AND email = ?';
    db.query(sql, [adminId, 'urestateofficial@gmail.com'], (err, results) => {
        if (err || results.length === 0) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    });
};

// GET ADMIN STATS
router.get('/stats', protect, adminOnly, (req, res) => {
    const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        totalProperties: 'SELECT COUNT(*) as count FROM properties',
        totalMessages: 'SELECT COUNT(*) as count FROM messages',
        totalReports: 'SELECT COUNT(*) as count FROM reports',
        totalImages: 'SELECT COUNT(*) as count FROM property_images',
        newUsersWeek: 'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
        newPropertiesWeek: 'SELECT COUNT(*) as count FROM properties WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
        officialListings: 'SELECT COUNT(*) as count FROM properties WHERE is_official = TRUE',
        byType: 'SELECT property_type, COUNT(*) as count FROM properties GROUP BY property_type',
        byPurpose: 'SELECT purpose, COUNT(*) as count FROM properties GROUP BY purpose',
        recentUsers: 'SELECT id, name, email, city, created_at FROM users ORDER BY created_at DESC LIMIT 10',
        recentProperties: 'SELECT id, title, location, price, property_type, created_at FROM properties ORDER BY created_at DESC LIMIT 10',
        recentReports: `SELECT r.*, p.title as property_title FROM reports r JOIN properties p ON r.property_id = p.id ORDER BY r.created_at DESC LIMIT 10`
    };

    const results = {};
    const queryKeys = Object.keys(queries);
    let completed = 0;

    queryKeys.forEach(key => {
        db.query(queries[key], (err, data) => {
            if (err) {
                results[key] = key.includes('total') || key.includes('new') || key.includes('official') ? 0 : [];
            } else {
                if (['totalUsers', 'totalProperties', 'totalMessages', 'totalReports', 'totalImages', 'newUsersWeek', 'newPropertiesWeek', 'officialListings'].includes(key)) {
                    results[key] = data[0].count;
                } else {
                    results[key] = data;
                }
            }
            completed++;
            if (completed === queryKeys.length) {
                res.json(results);
            }
        });
    });
});

module.exports = router;