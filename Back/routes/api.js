const express = require('express');
const router = express.Router();

router.use('/auth', require('./api/auth'));

router.use('/upload', require('./api/upload')); 

/*router.use('/theme', require('./api/theme'));*/

module.exports = router;