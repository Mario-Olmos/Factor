const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const authMiddleware = require('../../middlewares/authMiddelware');
const uploadImage = require('../../middlewares/uploadMiddlewareImages');

// Rutas para /api/profile

// Ruta para obtener información completa del usuario por username (perfil público)
router.get('/getUser/:id', userController.getUserById);

// Ruta para actualizar el perfil de un usuario
router.put('/update/:userId',authMiddleware, uploadImage, userController.updateUserProfile);

//Ruta para eliminar la cuenta
router.delete('/delete',authMiddleware, userController.deleteUser);

module.exports = router;