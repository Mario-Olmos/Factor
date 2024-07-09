const router = require('express').Router();

router.use('/songs', require('./api/songs'));

module.exports = router;