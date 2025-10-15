const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticateToken);

// GET /api/v1/dashboard/kpis
router.get('/kpis', dashboardController.getDashboardKpis);

// ✅ ADD THIS: GET /api/v1/dashboard/invoices
router.get('/invoices', dashboardController.getRecentInvoices);

module.exports = router;
