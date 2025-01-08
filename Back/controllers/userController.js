const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// Endpoint para validar el token
exports.validateToken = async (req, res) => {
    if (req.user) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false, message: 'Usuario no autenticado' });
    }
};


// Endpoint para cerrar Sesión
exports.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        path: '/'
    });
    return res.status(200).json({ message: 'Logout successful' });
};


// Controlador para registrar un nuevo usuario
exports.register = async (req, res) => {
    const { nombre, apellidos, email, password, fechaNacimiento } = req.body;

    try {

        // Comprobar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear un nuevo usuario
        const newUser = new User({
            nombre,
            apellidos,
            email,
            password: hashedPassword,
            fechaNacimiento,
            reputacion: 30
        });

        await newUser.save();

        // Generar un token JWT
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email, reputacion: newUser.reputacion },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({ token, user: newUser });
    } catch (err) {
        res.status(500).json({ message: 'Error al registrar usuario', error: err.message });
    }
};


// Controlador para iniciar sesión
exports.login = async (req, res) => {

    const { email, password } = req.body;

    try {
        // Comprobar si el usuario existe
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }
        // Comparar la contraseña
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }
        // Generar un token JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, reputacion: user.reputacion },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            //En desarrollo es false, cuando esté en un servidor real será true
            secure: false,
            maxAge: 60 * 60 * 1000, // 1 hora
            sameSite: 'Lax',
            path: '/'
        });

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.acreditaciones;
        delete userResponse.rol;
        delete userResponse.fechaNacimiento;

        res.status(200).json({ user: userResponse });

    } catch (err) {
        res.status(500).json({ message: 'Error al iniciar sesión', error: err.message });
    }
};


//Voto a un artículo del usuario que afecta en su valoración
exports.voteVeracidad = async (voterId, targetUserId, voteValue) => {
    try {
        const voter = await User.findById(voterId);
        const targetUser = await User.findById(targetUserId);

        if (!voter || !targetUser) {
            throw new Error('Voter or target user not found');
        }

        // Calcular el peso del voto basado en la veracidad del votante
        const voteWeight = voteValue * (voter.veracidad.puntuacion / (voter.veracidad.votos || 1));

        // Actualizar la puntuación y el contador de votos del usuario objetivo
        targetUser.veracidad.puntuacion += voteWeight;
        targetUser.veracidad.votos += 1;

        await targetUser.save();
        return targetUser;
    } catch (err) {
        throw err;
    }
};


//Devolver info del usuario a partir de su id
exports.getUserInfoById = async (userId) => {
    try {
        const user = await User.findById(userId, 'nombre apellidos imagenPerfil');
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        return {
            nombre: user.nombre,
            apellidos: user.apellidos,
            imagenPerfil: user.imagenPerfil || null,
        };
    } catch (error) {
        console.error(`Error al obtener información del usuario con ID ${userId}:`, error);
        throw error;
    }
};

//Devolver info del usuario a partir de su id
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { nombre, apellidos, email, fechaNacimiento, acreditaciones } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (nombre) user.nombre = nombre;
        if (apellidos) user.apellidos = apellidos;
        if (email) user.email = email;
        if (fechaNacimiento) user.fechaNacimiento = fechaNacimiento;

        // Si se sube un archivo (req.file) a través de Multer
        if (req.file) {
            // Guardamos la ruta en el campo imagenPerfil
            // Ejemplo: /uploads/profiles/nombre-del-archivo.jpg
            user.imagenPerfil = `api/uploads/profiles/${req.file.filename}`;
        }

        // Acreditaciones
        if (acreditaciones && Array.isArray(acreditaciones)) {
            user.acreditaciones = acreditaciones;
        }

        const updatedUser = await user.save();
        return res.status(200).json({
            message: 'Perfil actualizado correctamente',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error en updateUserProfile:', error);
        return res.status(500).json({
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};


