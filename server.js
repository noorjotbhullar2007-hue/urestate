const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const path = require('path');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Health check route for UptimeRobot
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Test route
app.get('/', (req, res) => {
    res.send('Property App Server is Running!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});