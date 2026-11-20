const express = require('express');
const router = express.Router();

const purchaseController = require('../controllers/purchaseController');

// GET all purchases
router.get('/', purchaseController.getAllPurchases);

// GET one purchase by ID
router.get('/:id', purchaseController.getPurchaseById);

// POST create a purchase
router.post('/', purchaseController.createPurchase);

// PUT update a purchase
router.put('/:id', purchaseController.updatePurchase);

// DELETE a purchase
router.delete('/:id', purchaseController.deletePurchase);

module.exports = router;