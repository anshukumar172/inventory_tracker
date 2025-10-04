const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/v1/warehouses
router.get('/', authenticateToken, warehouseController.getAllWarehouses);

// POST /api/v1/warehouses  
router.post('/', authenticateToken, warehouseController.createWarehouse);

// ✅ NEW: GET /api/v1/warehouses/:id - Get warehouse details
router.get('/:id', authenticateToken, warehouseController.getWarehouseById);

// ✅ NEW: GET /api/v1/warehouses/:id/batches - Get batches in warehouse  
router.get('/:id/batches', authenticateToken, warehouseController.getWarehouseBatches);

module.exports = router;
