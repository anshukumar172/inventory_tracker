const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/v1/customers
router.get('/', customerController.getAllCustomers);

// GET /api/v1/customers/:id
router.get('/:id', customerController.getCustomerById);

// POST /api/v1/customers
router.post('/', authorizeRoles('admin', 'accountant'), customerController.createCustomer);

// PUT /api/v1/customers/:id
router.put('/:id', authorizeRoles('admin', 'accountant'), customerController.updateCustomer);

module.exports = router;
