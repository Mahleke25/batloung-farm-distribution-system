const express = require('express');
const router = express.Router();

const purchaseDetailController = require('../controllers/purchaseDetailController');

// CREATE a purchase containing multiple items
router.post('/batch', purchaseDetailController.createBatchPurchase);

// GET all purchase details
router.get('/', purchaseDetailController.getAllPurchaseDetails);

// GET one purchase detail
router.get('/:id', purchaseDetailController.getPurchaseDetailById);

// CREATE one purchase detail
router.post('/', purchaseDetailController.createPurchaseDetail);

// UPDATE a purchase detail
router.put('/:id', purchaseDetailController.updatePurchaseDetail);

// DELETE a purchase detail
router.delete('/:id', purchaseDetailController.deletePurchaseDetail);

module.exports = router;