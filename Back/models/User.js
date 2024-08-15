const mongoose = require('mongoose');

// Definición del esquema para los títulos/estudios/acreditaciones
const AccreditationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    institution: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    }
});

// Definición del esquema del usuario
const UserSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    apellidos: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    fechaNacimiento: {
        type: Date,
        required: true,
    },
    rol: {
        type: String,
        enum: ['Usuario', 'Autor'], // Enum para especificar los roles posibles
        default: 'Usuario',
        required: true,
    },
    veracidad: {
        puntuacion: {
            type: Number,
            default: 0,
        },
        votos: {
            type: Number,
            default: 0,
        }
    },
    acreditaciones: [AccreditationSchema],
}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);
