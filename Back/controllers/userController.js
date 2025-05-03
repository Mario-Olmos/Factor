const User = require('../models/User');
const Article = require('../models/Article');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Endpoint para validar el token
exports.validateToken = async (req, res) => {
    if (req.user && req.user.userId) {
        try {
            const user = await User.findById(req.user.userId).select('username reputacion nombre apellidos email fechaNacimiento acreditaciones imagenPerfil');
            if (!user) {
                return res.json({ authenticated: false, message: 'Usuario no encontrado' });
            }

            res.json({
                authenticated: true, user:
                {
                    username: user.username,
                    reputacion: user.reputacion,
                    nombre: user.nombre,
                    apellidos: user.apellidos,
                    email: user.email,
                    fechaNacimiento: user.fechaNacimiento,
                    acreditaciones: user.acreditaciones,
                    imagenPerfil: user.imagenPerfil
                }
            });
        } catch (error) {
            console.error('Error al validar el token:', error);
            res.status(500).json({ authenticated: false, message: 'Error interno del servidor' });
        }
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
    return res.status(200).json({ message: 'Sesión terminada con éxito' });
};

//
const generateUniqueUsername = async (nombre, apellidos) => {
    const baseUsername = `${nombre}${apellidos}`.toLowerCase().replace(/\s+/g, '');
    const uniqueCode = uuidv4().split('-')[0];
    const username = `${baseUsername}${uniqueCode}`;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return generateUniqueUsername(nombre, apellidos);
    }

    return username;
};

// Controlador para registrar un nuevo usuario
exports.register = async (req, res) => {
    const { nombre, apellidos, email, password, fechaNacimiento } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const username = await generateUniqueUsername(nombre, apellidos);
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            nombre,
            apellidos,
            username,
            email,
            password: hashedPassword,
            fechaNacimiento,
            reputacion: 50
        });

        await newUser.save();

        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({ token, user: newUser.toJSON() });
    } catch (err) {
        res.status(500).json({ message: 'Error al registrar usuario', error: err.message });
    }
};

// Controlador para iniciar sesión
exports.login = async (req, res) => {

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }
        // Comparar la contraseña
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, username: user.username },
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

        const userResponse = {
            username: user.username,
            nombre: user.nombre,
            apellidos: user.apellidos,
            reputacion: user.reputacion,
            imagenPerfil: user.imagenPerfil,
            email: user.email,
            fechaNacimiento: user.fechaNacimiento,
            acreditaciones: user.acreditaciones
        };

        res.status(200).json({ user: userResponse });
    } catch (err) {
        res.status(500).json({ message: 'Error al iniciar sesión', error: err.message });
    }
};

//Devolver info del usuario a partir de su username (interfaz UserArticle para los artículos)
exports.getUserInfoById = async (username) => {
    try {
        const user = await User.findOne({ username }, 'username nombre apellidos imagenPerfil reputacion acreditaciones');
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        return {
            username: user.username,
            nombre: user.nombre,
            apellidos: user.apellidos,
            imagenPerfil: user.imagenPerfil,
            reputacion: user.reputacion,
            acreditaciones: user.acreditaciones
        };
    } catch (error) {
        console.error(`Error al obtener información del usuario con username: ${username}`, error);
        throw error;
    }
};

//Devolver info del usuario a partir de su username en la url (interfaz UserArticle para el perfil)
exports.getUserById = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }, 'username nombre apellidos imagenPerfil reputacion acreditaciones');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({
            user
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

//Actualizar perfil del usuario
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const { nombre, apellidos, fechaNacimiento, acreditaciones } = req.body;

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (nombre) user.nombre = nombre;
        if (apellidos) user.apellidos = apellidos;
        if (fechaNacimiento) {
            const fecha = new Date(fechaNacimiento);
            if (isNaN(fecha.getTime())) {
                return res.status(400).json({ message: 'Fecha de nacimiento inválida' });
            }
            user.fechaNacimiento = fecha;
        }

        if (req.file) {
            const imagenAnterior = user.imagenPerfil;

            user.imagenPerfil = `api/uploads/profiles/${req.file.filename}`;

            if (imagenAnterior) { 
                const imagePath = path.join(__dirname, '..', imagenAnterior.replace(/^api\//, ''));

                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Error al eliminar la imagen anterior:', err);
                    } else {
                        console.log('Imagen anterior eliminada correctamente:', imagenAnterior);
                    }
                });
            }
        }

        // Acreditaciones
        if (acreditaciones && Array.isArray(acreditaciones)) {
            user.acreditaciones = acreditaciones;
        }

        await user.save();

        return res.status(200).json({
            message: 'Perfil actualizado correctamente',
            user: {
                username: user.username,
                reputacion: user.reputacion,
                nombre: user.nombre,
                email: user.email,
                fechaNacimiento: user.fechaNacimiento,
                apellidos: user.apellidos,
                acreditaciones: user.acreditaciones,
                imagenPerfil: user.imagenPerfil
            }
        });

    } catch (error) {
        console.error('Error en updateUserProfile:', error);
        return res.status(500).json({
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

//Eliminar cuenta del usuario y sus artículos si así lo desea
exports.deleteUser = async (req, res) => {
    try {
        const { deleteArticles } = req.query;

        const user = await User.findById(req.user.userId)
            .select('nombre apellidos email reputacion fechaNacimiento acreditaciones imagenPerfil')
            .lean();
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (deleteArticles === 'true') {
            const articles = await Article.find({ author: user._id });
            for (const article of articles) {
                if (article.pdfUrl) {
                    const pdfPath = path.join(__dirname, '..', article.pdfUrl);
                    fs.unlink(pdfPath, (err) => {
                        if (err) console.error('Error al eliminar el PDF:', err);
                    });
                }
            }
            await Article.deleteMany({ author: user._id });
        } else {
            await Article.updateMany(
                { author: user._id },
                {
                    $set: {
                        author: null,
                        deleted: true,
                        authorInfo: {
                            nombre: user.nombre,
                            apellidos: user.apellidos,
                            reputacion: user.reputacion,
                            acreditaciones: user.acreditaciones || [],
                            imagenPerfil: user.imagenPerfil
                        }
                    }
                }
            );
        }

        if (user.imagenPerfil) {
            const imagePathRelative = user.imagenPerfil.replace(/^api\//, '');
            const profileImagePath = path.join(__dirname, '..', imagePathRelative);
            fs.unlink(profileImagePath, (err) => {
                if (err) console.error('Error al eliminar la imagen de perfil:', err);
            });
        }

        await User.findByIdAndDelete(user._id);

        return res.status(200).json({ message: 'Cuenta eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar la cuenta:', error);
        return res.status(500).json({ message: 'Error al eliminar la cuenta.', error: error.message });
    }
};

exports.getUserPrivileges = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const votingLimit = getVotingLimit(user.reputacion);         
        const publicationLimit = getPublicationLimit(user.reputacion); 

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const usedVotesInLastWeek = await Article.countDocuments({
            'votes.user': user._id,
            'votes.votedAt': { $gte: oneWeekAgo }
        });

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const usedPublicationsInLastMonth = await Article.countDocuments({
            author: user._id,
            createdAt: { $gte: oneMonthAgo }
        });

        return res.status(200).json({
            votingLimit,
            usedVotesInLastWeek,
            publicationLimit,
            usedPublicationsInLastMonth
        });

    } catch (error) {
        console.error('Error al obtener privilegios del usuario:', error);
        return res.status(500).json({ message: 'Error interno al obtener privilegios', error: error.message });
    }
};

//Función con las reglas de publicación por reputación
const getPublicationLimit = (reputacion) => {
    if (reputacion >= 71) return Infinity;
    if (reputacion >= 51) return 4;
    if (reputacion >= 31) return 2;
    if (reputacion >= 15) return 1;
    return 0;
};

//Función con las reglas de votación por reputación
const getVotingLimit = (reputacion) => {
    if (reputacion >= 71) return Infinity;
    if (reputacion >= 51) return 5;
    if (reputacion >= 31) return 3;
    if (reputacion >= 15) return 1;
    return 0;
};



