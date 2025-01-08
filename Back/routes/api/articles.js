const express = require('express');
const router = express.Router();
const articleController = require('../../controllers/articleController');

router.get('/getArticles', articleController.obtenerArticulosFeed);

router.post('/meGusta', articleController.darLike);

router.get('/getArticlesByUser', articleController.getArticlesByUser);

router.get('/:id', articleController.getArticleById);

module.exports = router;