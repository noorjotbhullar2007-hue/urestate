const express = require('express');
const router = express.Router();
const db = require('../config/db');
const upload = require('../config/multerConfig');
const protect = require('../middleware/authMiddleware');

// ADD PROPERTY (protected, with image upload)
router.post('/add', protect, upload.array('images', 5), (req, res) => {
    const {
        title, description, price, location, property_type, purpose,
        negotiable_price, address, plot_size, built_up_area, carpet_area,
        floor_number, total_floors, bedrooms, bathrooms, balconies,
        parking, furnished_status, property_age, facing, ownership_type,
        availability_date, nearby_landmarks, latitude, longitude
    } = req.body;

    const userId = req.userId;

    if (!title || !price || !location || !purpose || !bedrooms || !bathrooms || !furnished_status || !property_age) {
        return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const sql = `INSERT INTO properties 
        (user_id, title, description, price, location, property_type, purpose,
        negotiable_price, address, plot_size, built_up_area, carpet_area,
        floor_number, total_floors, bedrooms, bathrooms, balconies,
        parking, furnished_status, property_age, facing, ownership_type,
        availability_date, nearby_landmarks, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [
        userId, title, description, price, location, property_type, purpose,
        negotiable_price === 'true' ? 1 : 0, address || null, plot_size || null, built_up_area || null, carpet_area || null,
        floor_number || null, total_floors || null, bedrooms, bathrooms, balconies || null,
        parking === 'true' ? 1 : 0, furnished_status, property_age, facing || null, ownership_type || null,
        availability_date || null, nearby_landmarks || null, latitude || null, longitude || null
    ],
     (err, result) => {
        if (err) return res.status(500).json({ message: 'Error adding property', error: err });

        const propertyId = result.insertId;

        if (req.files && req.files.length > 0) {
            const imageValues = req.files.map(file => [propertyId, file.path]);
            const imgSql = 'INSERT INTO property_images (property_id, image_path) VALUES ?';
            db.query(imgSql, [imageValues], (imgErr) => {
                if (imgErr) console.error(imgErr);
            });
        }

        res.status(201).json({ message: 'Property added successfully!', propertyId });
    });
});

// GET ALL PROPERTIES (with optional filters)
router.get('/', (req, res) => {
    const { location, purpose, property_type, minPrice, maxPrice, bedrooms, bathrooms, furnished_status } = req.query;

    let sql = `
        SELECT p.*, 
        (SELECT image_path FROM property_images WHERE property_id = p.id LIMIT 1) AS thumbnail
        FROM properties p WHERE 1=1
    `;
    const params = [];

    if (location) {
        sql += ' AND location LIKE ?';
        params.push(`%${location}%`);
    }
    if (purpose) {
        sql += ' AND purpose = ?';
        params.push(purpose);
    }
    if (property_type) {
        sql += ' AND property_type = ?';
        params.push(property_type);
    }
    if (minPrice) {
        sql += ' AND price >= ?';
        params.push(minPrice);
    }
    if (maxPrice) {
        sql += ' AND price <= ?';
        params.push(maxPrice);
    }
    if (bedrooms) {
        sql += ' AND bedrooms >= ?';
        params.push(bedrooms);
    }
    if (bathrooms) {
        sql += ' AND bathrooms >= ?';
        params.push(bathrooms);
    }
    if (furnished_status) {
        sql += ' AND furnished_status = ?';
        params.push(furnished_status);
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching properties', error: err });
        res.json(results);
    });
});

// GET SINGLE PROPERTY (with its images)
router.get('/:id', (req, res) => {
    const propertyId = req.params.id;

    const sql = `SELECT p.*, u.phone as owner_phone FROM properties p JOIN users u ON p.user_id = u.id WHERE p.id = ?`;
    db.query(sql, [propertyId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error fetching property', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Property not found' });

        const property = results[0];

        const imgSql = 'SELECT image_path FROM property_images WHERE property_id = ?';
        db.query(imgSql, [propertyId], (imgErr, images) => {
            if (imgErr) return res.status(500).json({ message: 'Error fetching images', error: imgErr });

            property.images = images.map(img => img.image_path);
            res.json(property);
        });
    });
});

// EDIT PROPERTY (protected, owner only)
router.put('/:id', protect, (req, res) => {
    const propertyId = req.params.id;
    const userId = req.userId;
    const {
        title, description, price, location, property_type, purpose,
        negotiable_price, address, plot_size, built_up_area, carpet_area,
        floor_number, total_floors, bedrooms, bathrooms, balconies,
        parking, furnished_status, property_age, facing, ownership_type,
        availability_date, nearby_landmarks, latitude, longitude
    } = req.body;

    const checkSql = 'SELECT * FROM properties WHERE id = ?';
    db.query(checkSql, [propertyId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Property not found' });

        if (results[0].user_id !== userId) {
            return res.status(403).json({ message: 'You are not authorized to edit this property' });
        }

        const updateSql = `UPDATE properties SET 
            title=?, description=?, price=?, location=?, property_type=?, purpose=?,
            negotiable_price=?, address=?, plot_size=?, built_up_area=?, carpet_area=?,
            floor_number=?, total_floors=?, bedrooms=?, bathrooms=?, balconies=?,
            parking=?, furnished_status=?, property_age=?, facing=?, ownership_type=?,
            availability_date=?, nearby_landmarks=?, latitude=?, longitude=?
            WHERE id=?`;

        db.query(updateSql, [
            title, description, price, location, property_type, purpose,
            negotiable_price === 'true' ? 1 : 0, address, plot_size || null, built_up_area || null, carpet_area || null,
            floor_number || null, total_floors || null, bedrooms, bathrooms, balconies || null,
            parking === 'true' ? 1 : 0, furnished_status, property_age, facing || null, ownership_type || null,
            availability_date || null, nearby_landmarks || null, latitude || null, longitude || null, propertyId
        ], (updateErr) => {
            if (updateErr) return res.status(500).json({ message: 'Error updating property', error: updateErr });
            res.json({ message: 'Property updated successfully!' });
        });
    });
});

// DELETE PROPERTY (protected, owner only)
router.delete('/:id', protect, (req, res) => {
    const propertyId = req.params.id;
    const userId = req.userId;

    const checkSql = 'SELECT * FROM properties WHERE id = ?';
    db.query(checkSql, [propertyId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Property not found' });

        if (results[0].user_id !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this property' });
        }

        const deleteImagesSql = 'DELETE FROM property_images WHERE property_id = ?';
        db.query(deleteImagesSql, [propertyId], (imgErr) => {
            if (imgErr) return res.status(500).json({ message: 'Error deleting property images', error: imgErr });

            const deleteSql = 'DELETE FROM properties WHERE id = ?';
            db.query(deleteSql, [propertyId], (deleteErr) => {
                if (deleteErr) return res.status(500).json({ message: 'Error deleting property', error: deleteErr });
                res.json({ message: 'Property deleted successfully!' });
            });
        });
    });
});

module.exports = router;