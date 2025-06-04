const express = require('express');
const router = express.Router();

router.use('/auth', require('./api/auth'));

router.use('/upload', require('./api/upload')); //Subida de archivos 

router.use('/theme', require('./api/theme'));

router.use('/articles', require('./api/articles'));

router.use('/uploads', require('./api/uploads')); //Archivos estáticos

router.use('/profile', require('./api/profile'));

module.exports = router;