const express = require('express');
const router = express.Router();

const supplierController = require('../controllers/supplierController');

// GET all suppliers
router.get('/', supplierController.getAllSuppliers);

// GET supplier by ID
router.get('/:id', supplierController.getSupplierById);

// POST create a new supplier
router.post('/', supplierController.createSupplier);

// PUT update an existing supplier
router.put('/:id', supplierController.updateSupplier);


// DELETE an existing supplier
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;