const express = require('express');
const path = require('path');
const router = express.Router();

//rutas para api/uploads

router.use('/pdf', (req, res, next) => {
    res.setHeader('Content-Type', 'application/pdf'); // Asegura que el archivo se identifique como PDF
    next(); 
}, express.static(path.join(__dirname, '../../uploads/pdf')));


module.exports = router;