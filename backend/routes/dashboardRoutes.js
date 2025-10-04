const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticateToken);

// GET /api/v1/dashboard/kpis
router.get('/kpis', dashboardController.getDashboardKpis);

module.exports = router;
