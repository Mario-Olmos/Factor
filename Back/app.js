const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

require('dotenv').config();
require('./config/db');

const app = express();

//Config
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true // Permitir el envío de cookies
}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

//GET /api
app.use('/api', require('./routes/api'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
})