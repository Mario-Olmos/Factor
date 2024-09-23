const express = require('express');
const router = express.Router();
const themeController = require('../../controllers/themeController');

// rutas para ./api/theme

router.get('/getThemes', themeController.getThemes);

module.exports = router;