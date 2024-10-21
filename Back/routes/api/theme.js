const express = require('express');
const router = express.Router();
const themeController = require('../../controllers/themeController');

// rutas para ./api/theme

router.get('/getThemes', themeController.getThemes);

router.get('/getTrendyThemes', themeController.getTrendyThemes);

module.exports = router;