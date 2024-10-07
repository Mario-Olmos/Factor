const express = require('express');
const router = express.Router();
const articleControler = require('../../controllers/articleController');

router.get('/getArticles', articleControler.getArticles);

module.exports = router;