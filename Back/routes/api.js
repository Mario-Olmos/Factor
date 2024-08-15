const express = require('express');
const router = express.Router();

router.use('/profile', require('./api/profile'));

/*router.use('/articles', require('./api/articles'));

router.use('/theme', require('./api/theme'));*/

module.exports = router;