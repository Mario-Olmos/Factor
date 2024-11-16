const Article = require('../models/Article');
const { getThemeHierarchyById } = require('./themeController');
const User = require('../models/User');
const path = require('path');


//Método para subir un artículo
exports.uploadArticle = async (req, res) => {
    try {
        const { title, description, author, theme } = req.body;

        const user = await User.findById(author);

        if (user.reputacion < 20) {
            return res.status(403).json({
                message: 'No tienes suficiente reputación para publicar un artículo'
            });
        }

        // URL del PDF subido
        const pdfUrl = `/uploads/pdf/${req.file.filename}`;

        // Crear el artículo con la URL del PDF
        const newArticle = new Article({
            title,
            description,
            pdfUrl,
            author,
            theme,
            authorReputationAtCreation: user.reputacion,
        });

        if (user.reputacion >= 50) {
            // Impulso inicial (máximo de 10)
            newArticle.veracity = math.min(7.5, ((user.reputacion / 100) * 10));
        }

        await newArticle.save();

        res.status(201).json({
            message: 'Artículo creado con éxito',
            newArticle
        });

    } catch (err) {
        console.error('Error al crear el artículo:', err);

        // Si hay un error, eliminar el archivo PDF del servidor
        if (req.file && req.file.path) {
            const filePath = path.join(__dirname, '..', req.file.path);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error al eliminar el archivo:', unlinkErr);
                } else {
                    console.log('Archivo eliminado debido a error en BD');
                }
            });
        }

        res.status(500).json({ error: 'Error subiendo el PDF o creando el artículo' });
    }
};


//Método para obetener los artículos del feed, con el voto del usuario logeado y jerarquía de temas
exports.obtenerArticulosFeed = async (req, res) => {
    try {
        const { page = 1, limit = 10, userId } = req.query;
        const diasRecientes = 60;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - diasRecientes);

        // Obtenemos los artículos dentro del período reciente y con veracidad positiva
        const articles = await Article.find({
            veracity: { $gt: -1 },
            createdAt: { $gte: fechaLimite }
        })
            .sort({ veracity: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Agregar el voto del usuario y jerarquía de temas
        const articlesWithDetails = await Promise.all(
            articles.map(async (article) => {
                
                const userVoteObj = article.votes.find(vote => vote.user.toString() === userId);
                const userVote = userVoteObj ? userVoteObj.voteType : null;

                const themes = article.theme
                    ? await getThemeHierarchyById(article.theme)
                    : { nivel1: null, nivel2: null, nivel3: null };

                return {
                    ...article,
                    userVote,
                    themes,
                    votes: undefined
                };
            })
        );

        return res.status(200).json(articlesWithDetails);
    } catch (error) {
        console.error('Error al cargar el feed de artículos:', error);
        return res.status(500).json({ message: 'Error al cargar el feed de artículos', error: error.message });
    }
};


//Método para dar like a un artículo
exports.darLike = async (req, res) => {
    try {
        const { articleId, pesoVoto, user, voteType } = req.body;

        const usuario = await User.findById(user);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        if (usuario.reputacion < 50) { 
            return res.status(403).json({ message: 'No tienes suficiente reputación para votar' });
        }

        const articulo = await Article.findById(articleId);
        if (!articulo) {
            return res.status(404).json({ message: 'Artículo no encontrado' });
        }

        const votoExistente = articulo.votes.find(vote => vote.user.toString() === usuario._id.toString());

        if (votoExistente) {
            return res.status(400).json({ message: 'Ya has votado este artículo' });
        }

        const cambioVeracidad = voteType === 'upvote' ? pesoVoto : -pesoVoto;

        const updatedArticle = await Article.findByIdAndUpdate(
            articleId,
            {
                $inc: { veracity: cambioVeracidad },
                $push: {
                    votes: {
                        user: usuario._id,
                        voteType: voteType,
                        votedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        return res.status(200).json({ message: 'Voto registrado correctamente', articulo: updatedArticle });

    } catch (error) {
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};


