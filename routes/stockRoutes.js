const express = require('express');
const router = express.Router();

const stockController = require('../controllers/stockController');

// GET all stock records
router.get('/', stockController.getAllStock);

// GET low-stock records
router.get('/low-stock', stockController.getLowStock);

// GET stock by StockID
router.get('/record/:id', stockController.getStockById);

// GET stock by FruitID
router.get('/fruit/:fruitId', stockController.getStockByFruit);

// POST create a stock record
router.post('/', stockController.createStock);

// PUT update selling price
router.put('/:id', stockController.updateStock);

// DELETE a stock record
router.delete('/:id', stockController.deleteStock);

module.exports = router;