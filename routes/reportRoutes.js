const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');

// REPORT 1: Top five best-selling fruits
router.get('/top-fruits', reportController.getTopFiveFruits);

// REPORT 2: Revenue by date range
router.get('/revenue', reportController.getRevenueByDateRange);

// REPORT 3: Vendor with the highest number of boxes sold
router.get('/top-vendor', reportController.getTopVendor);

// REPORT 4: Current stock by fruit and packaging size
router.get('/stock', reportController.getCurrentStockReport);

// REPORT 5: Outstanding payments
router.get('/outstanding', reportController.getOutstandingPayments);

module.exports = router;