const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');

// Rutas para /api/profile

router.get('/getUser/:id', userController.getUserById);

module.exports = router;