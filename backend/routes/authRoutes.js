const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authenticateToken, authorizeRoles('admin'), authController.register);
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
