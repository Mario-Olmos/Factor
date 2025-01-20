const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const authMiddleware = require('../../middlewares/authMiddelware');

// Rutas para /api/auth

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/validate-token', authMiddleware, userController.validateToken);
router.post('/logout',authMiddleware, userController.logout);

module.exports = router;