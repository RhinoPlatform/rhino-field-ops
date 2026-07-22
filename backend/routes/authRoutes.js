const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/auth/login', authController.login);
router.post('/auth/register', verifyToken, requireRole(['Admin']), authController.register);

module.exports = router;
