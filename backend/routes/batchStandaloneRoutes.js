const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { authenticateToken } = require('../middleware/auth');

console.log('📦 Standalone batch routes loaded');

// GET /api/v1/batches - Get all batches
router.get('/', authenticateToken, batchController.getAllBatches);

// GET /api/v1/batches/:id - Get specific batch
router.get('/:id', authenticateToken, batchController.getBatchById);

// PUT /api/v1/batches/:id - Update batch (THIS WAS THE PROBLEM LINE)
router.put('/:id', authenticateToken, batchController.updateBatch);

// DELETE /api/v1/batches/:id - Delete batch
router.delete('/:id', authenticateToken, batchController.deleteBatch);

module.exports = router;
