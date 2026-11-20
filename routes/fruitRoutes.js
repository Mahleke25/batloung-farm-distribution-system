const express = require('express');

const router = express.Router();

// Import fruit controller
const fruitController = require('../controllers/fruitController');

// GET all fruits
router.get('/', fruitController.getAllFruits);

// GET fruit by ID
router.get('/:id', fruitController.getFruitById);

// POST create a new fruit
router.post('/', fruitController.createFruit);

// PUT update a fruit
router.put('/:id', fruitController.updateFruit);

// DELETE a fruit
router.delete('/:id', fruitController.deleteFruit);

module.exports = router;