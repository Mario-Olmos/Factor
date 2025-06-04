const express = require('express');
const router = express.Router();
const articleController = require('../../controllers/articleController');
const authMiddleware = require('../../middlewares/authMiddelware');

router.get('/getArticles',authMiddleware, articleController.obtenerArticulosFeed);

router.post('/meGusta', authMiddleware, articleController.darLike);

router.get('/getArticles-ByUser', authMiddleware, articleController.getArticlesByUser);

router.get('/getActivity-ByUser', authMiddleware, articleController.getActivityByUser);

router.delete('/deleteArticle', authMiddleware,  articleController.eliminarArticulo);

router.get('/:id',authMiddleware, articleController.getArticleById);

module.exports = router;