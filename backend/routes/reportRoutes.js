
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

console.log('📊 Report Routes loaded');

// GST Reports
router.get('/gst', authenticateToken, reportController.generateGSTReport);

// Sales Reports  
router.get('/sales', authenticateToken, reportController.generateSalesReport);

// Stock Reports
router.get('/stock', authenticateToken, reportController.generateStockReport);

// Stock Movement Reports
router.get('/stock-movements', authenticateToken, reportController.generateStockMovementReport);

// Utility endpoints
router.get('/states', authenticateToken, reportController.getStates);

console.log('✅ Report Routes configured');

module.exports = router;
