const express = require('express');
const router = express.Router();
const articleController = require('../../controllers/articleController');
const uploadMiddlewarePDF = require('../../middlewares/uploadMiddlewarePDF');
const authMiddleware = require('../../middlewares/authMiddelware');
const themeController = require('../../controllers/themeController');

// Rutas para /api/upload

router.post('/', authMiddleware, uploadMiddlewarePDF, articleController.uploadArticle);

router.post('/theme', themeController.createTheme);

module.exports = router;