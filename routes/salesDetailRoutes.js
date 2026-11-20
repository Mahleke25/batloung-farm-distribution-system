const express = require('express');
const router = express.Router();

const salesDetailController = require('../controllers/salesDetailController');

// GET all sales details
router.get('/', salesDetailController.getAllSalesDetails);

// POST a sale containing multiple items
router.post('/batch', salesDetailController.createBatchSale);

// GET one sales detail by ID
router.get('/:id', salesDetailController.getSaleDetailById);

// POST one sales detail
router.post('/', salesDetailController.createSaleDetail);

// PUT update a sales detail
router.put('/:id', salesDetailController.updateSaleDetail);

// DELETE a sales detail
router.delete('/:id', salesDetailController.deleteSaleDetail);

module.exports = router;