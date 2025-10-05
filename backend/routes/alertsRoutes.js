const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/v1/alerts/active - Get all active alerts
router.get('/active', alertController.getActiveAlerts);

// GET /api/v1/alerts/summary - Get alert summary
router.get('/summary', alertController.getAlertSummary);

// POST /api/v1/alerts/check - Check alerts manually
router.post('/check', alertController.checkAlerts);

module.exports = router;
