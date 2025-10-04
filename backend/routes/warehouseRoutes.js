const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { authenticateToken } = require('../middleware/auth');
// GET /api/v1/warehouses
router.get('/', warehouseController.getAllWarehouses);

// POST /api/v1/warehouses
router.post('/', warehouseController.createWarehouse);

module.exports = router;
