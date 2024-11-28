const express = require('express');
const router = express.Router();

router.use('/auth', require('./api/auth'));

router.use('/upload', require('./api/upload')); 

router.use('/theme', require('./api/theme'));

router.use('/articles', require('./api/articles'));

router.use('/uploads', require('./api/uploads'));

module.exports = router;