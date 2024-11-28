const express = require('express');
const path = require('path');
const router = express.Router();

//rutas para api/uploads

router.use('/pdf', express.static(path.join(__dirname, '../../uploads/pdf')));

module.exports = router;