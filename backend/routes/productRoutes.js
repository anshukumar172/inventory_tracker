const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/v1/products
router.get('/', productController.getAllProducts);

// GET /api/v1/products/:id  
router.get('/:id', productController.getProductById);

// POST /api/v1/products
router.post('/', authorizeRoles('admin', 'warehouse_user'), productController.createProduct);

// PUT /api/v1/products/:id
router.put('/:id', authorizeRoles('admin', 'warehouse_user'), productController.updateProduct);

// DELETE /api/v1/products/:id
router.delete('/:id', authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;
