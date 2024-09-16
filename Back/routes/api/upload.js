const express = require('express');
const router = express.Router();
const articleController = require('../../controllers/articleController');
const uploadMiddleware = require('../../middlewares/uploadMiddleware');

// Rutas para /api/upload

router.post('/', uploadMiddleware, articleController.uploadArticle);

module.exports = router;