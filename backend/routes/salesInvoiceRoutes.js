const express = require('express');
const router = express.Router();
const salesInvoiceController = require('../controllers/salesInvoiceController');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// GET recent invoices for dashboard


router.get('/', (req, res) => {
  if (req.query.recent === 'true') {
    return dashboardController.getRecentInvoices(req, res);
  }
  // Missing closing and proper handling
  res.json([]);
});
router.post('/', authorizeRoles('admin', 'accountant'), salesInvoiceController.createInvoice);
router.get('/:id', salesInvoiceController.getInvoiceById);

module.exports = router;
