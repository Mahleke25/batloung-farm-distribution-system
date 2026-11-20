require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// Middleware
const notFound = require('./middleware/notFound');

// Routes
const supplierRoutes = require('./routes/supplierRoutes');
const fruitRoutes = require('./routes/fruitRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const purchaseDetailRoutes = require('./routes/purchaseDetailRoutes');
const stockRoutes = require('./routes/stockRoutes');
const salesRoutes = require('./routes/salesRoutes');
const salesDetailRoutes = require('./routes/salesDetailRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Initialize Express
const app = express();

// General middleware
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/suppliers', supplierRoutes);
app.use('/api/fruits', fruitRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/purchase-details', purchaseDetailRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/sales-details', salesDetailRoutes);
app.use('/api/reports', reportRoutes);

// Home route
app.get('/', function(req, res) {
    res.send('Batloung Farm Distribution Management System API is running!');
});

// Database connection test
app.get('/api/test-db', async function(req, res) {
    try {
        const [rows] = await db.query(
            'SELECT DATABASE() AS databaseName'
        );

        res.status(200).json({
            success: true,
            message: 'Database connected successfully!',
            database: rows[0].databaseName
        });

    } catch (error) {
        console.error('Database connection error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Database connection failed.',
            error: error.message
        });
    }
});

// Handle unknown routes
app.use(notFound);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, function() {
    console.log('Batloung Farm server running on port ' + PORT);
});