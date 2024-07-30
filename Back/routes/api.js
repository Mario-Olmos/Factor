const router = require('express').Router();

router.use('/songs', require('./api/songs'));

router.use('/articles', require('./api/articles'));

router.use('/profile', require('./api/profile'));

router.use('/theme', require('./api/theme'));

module.exports = router;