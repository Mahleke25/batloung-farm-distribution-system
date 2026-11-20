const express = require('express');

const router = express.Router();

// Import vendor controller
const vendorController = require('../controllers/vendorController');

// GET all vendors
router.get('/', vendorController.getAllVendors);

// SEARCH vendors
router.get('/search', vendorController.searchVendors);

// GET vendor by ID
router.get('/:id', vendorController.getVendorById);

// POST create a new vendor
router.post('/', vendorController.createVendor);

// PUT update a vendor
router.put('/:id', vendorController.updateVendor);

// DELETE a vendor
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;