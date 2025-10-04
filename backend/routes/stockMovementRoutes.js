const express = require('express');
const router = express.Router();
const stockMovementController = require('../controllers/stockMovementControllers');
const { authenticateToken } = require('../middleware/auth');

console.log('📦 Stock movement routes loaded');

// GET /api/v1/stock-movements - Get all stock movements
router.get('/', authenticateToken, stockMovementController.getAllStockMovements);

// POST /api/v1/stock-movements - Create stock movement
router.post('/', authenticateToken, stockMovementController.createStockMovement);

// GET /api/v1/stock-movements/product/:productId - Get movements for specific product
router.get('/product/:productId', authenticateToken, stockMovementController.getMovementsByProductId);

module.exports = router;
