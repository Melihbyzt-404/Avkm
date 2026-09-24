const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Açık Rotalar
router.post('/register', authController.register);
router.post('/login', authController.login);

// Korumalı Rota (Token gerektirir)
router.get('/me', verifyToken, authController.getMe);

module.exports = router;