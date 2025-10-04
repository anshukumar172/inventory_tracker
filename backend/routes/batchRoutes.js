const express = require('express');
const router = express.Router({ mergeParams: true });
const batchController = require('../controllers/batchController');
const { authenticateToken } = require('../middleware/auth');

console.log('📦 Batch routes loaded');

// GET /api/v1/products/:id/batches
router.get('/', authenticateToken, batchController.getBatchesByProductId);

// POST /api/v1/products/:id/batches  
router.post('/', authenticateToken, batchController.createBatch);

// GET /api/v1/batches (standalone route for all batches)
router.get('/all', authenticateToken, batchController.getAllBatches);

module.exports = router;
