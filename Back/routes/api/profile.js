const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');

// Rutas para /api/profile

router.get('/getUser/:id', userController.getUserById);

// Ruta para actualizar el perfil de un usuario
router.put('/update/:userId', userController.updateUserProfile);

module.exports = router;