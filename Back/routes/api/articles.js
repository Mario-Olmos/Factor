const express = require('express');
const router = express.Router();
const articleController = require('../../controllers/articleController');

router.get('/getArticles', articleController.getArticles);

router.post('/meGusta', articleController.darLike);

module.exports = router;