const express = require('express');
const router = express.Router();
const articleController = require('../../controllers/articleController');
const authMiddleware = require('../../middlewares/authMiddelware');

router.get('/getArticles',authMiddleware, articleController.obtenerArticulosFeed);

router.post('/meGusta', authMiddleware, articleController.darLike);

router.get('/getArticlesByUser', authMiddleware, articleController.getArticlesByUser);

router.get('/getActivityByUser', authMiddleware, articleController.getActivityByUser);

router.delete('/deleteArticle', authMiddleware,  articleController.eliminarArticulo);

router.get('/:id',authMiddleware, articleController.getArticleById);

module.exports = router;