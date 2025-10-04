const express = require('express');
const router = express.Router();
const stockMovementController = require('../controllers/stockMovementControllers');
const { authenticateToken } = require('../middleware/auth');

console.log('📦 Stock Movement routes loaded');

// POST /api/v1/stock-movements - Create new stock movement
router.post('/', authenticateToken, stockMovementController.createStockMovement);

// GET /api/v1/stock-movements - Get all stock movements with filters
router.get('/', authenticateToken, stockMovementController.getAllStockMovements);

// GET /api/v1/stock-movements/valuation - Get stock valuation
router.get('/valuation', authenticateToken, stockMovementController.getStockValuation);

// GET /api/v1/stock-movements/product/:productId - Get movements for specific product
router.get('/product/:productId', authenticateToken, stockMovementController.getMovementsByProductId);

// GET /api/v1/stock-movements/ledger/:productId - Get stock ledger for product
router.get('/ledger/:productId', authenticateToken, stockMovementController.getStockLedger);

// GET /api/v1/stock-movements/:id - Get specific movement
router.get('/:id', authenticateToken, stockMovementController.getMovementById);

module.exports = router;
