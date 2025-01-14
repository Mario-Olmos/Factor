const Article = require('../models/Article');
const { getThemeHierarchyById } = require('./themeController');
const { getAllDescendantThemeIds } = require('../controllers/themeController');
const { getUserInfoById } = require('./userController');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');


//Método para subir un artículo
exports.uploadArticle = async (req, res) => {
    try {
        const { title, description, author, theme, source } = req.body;

        const user = await User.findById(author);

        if (!source) {
            return res.status(400).json({
                message: 'La fuente es requerida.'
            });
        }

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado.'
            });
        }

        if (user.reputacion < 15) {
            return res.status(403).json({
                message: 'No tienes suficiente reputación para publicar un artículo'
            });
        }

        if (!puedePublicar(user)) {
            return res.status(403).json({
                message: 'Has alcanzado el límite de publicaciones permitidas para tu nivel de reputación.'
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
            source
        });

        if (user.reputacion >= 50) {
            // Impulso inicial (máximo de 10)
            newArticle.veracity = Math.min(7, ((user.reputacion / 100) * 10));
        }

        await newArticle.save();

        user.fechaUltimaPublicacion = new Date();
        await user.save();

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
        const { page = 1, limit = 10, userId, tema, ordenarPorFecha, ordenarPorVeracidad } = req.query;
        const diasRecientes = 200;
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - diasRecientes);

        let query = {
            veracity: { $gt: -1 },
            createdAt: { $gte: fechaLimite }
        };

        // Si se proporciona un tema, obtenemos todos sus descendientes
        if (tema) {
            const allThemeIds = await getAllDescendantThemeIds(tema);
            query.theme = { $in: allThemeIds };
        }

        // Obtener los artículos dentro del período reciente y con veracidad positiva
        let articlesQuery = Article.find(query).lean();

        // Ordenar por veracidad y fecha si se especifica
        if (ordenarPorVeracidad) {
            articlesQuery = articlesQuery.sort({ veracity: ordenarPorVeracidad === 'asc' ? 1 : -1 });
        }

        if (ordenarPorFecha) {
            articlesQuery = articlesQuery.sort({ createdAt: ordenarPorFecha === 'asc' ? 1 : -1 });
        }

        // Paginación
        const articles = await articlesQuery
            .skip((page - 1) * limit)
            .limit(limit);

        // Agregar el voto del usuario y jerarquía de temas
        const articlesWithDetails = await Promise.all(
            articles.map(async (article) => {

                const userVoteObj = article.votes.find(vote => vote.user.toString() === userId);
                const userVote = userVoteObj ? userVoteObj.voteType : null;

                const upVotes = article.votes.filter(vote => vote.voteType === 'upvote').length;
                const downVotes = article.votes.filter(vote => vote.voteType === 'downvote').length;

                const themes = article.theme
                    ? await getThemeHierarchyById(article.theme)
                    : { nivel1: null, nivel2: null, nivel3: null };

                const authorInfo = await getUserInfoById(article.author);

                return {
                    ...article,
                    userVote,
                    themes,
                    upVotes,
                    downVotes,
                    authorInfo,
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

        if (usuario.reputacion < 15) { 
            return res.status(403).json({ message: 'No tienes suficiente reputación para votar' });
        }

        if (!puedeVotar(usuario)) {
            return res.status(403).json({ message: 'Has alcanzado el límite de votaciones permitidas para tu nivel de reputación.' });
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

        usuario.fechaUltimoVoto = new Date();
        await usuario.save();

        return res.status(200).json({ message: 'Voto registrado correctamente', articulo: updatedArticle });

    } catch (error) {
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};


// Detalle del artículo
exports.getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        // Encuentra el artículo por ID
        const article = await Article.findById(id);

        if (!article) {
            return res.status(404).json({ message: 'Artículo no encontrado' });
        }

        const themeHierarchy = await getThemeHierarchyById(article.theme);
        const authorInfo = await getUserInfoById(article.author);
        const userVoteObj = article.votes.find(vote => vote.user.toString() === userId);
        const userVote = userVoteObj ? userVoteObj.voteType : null;
        const upVotes = article.votes.filter(vote => vote.voteType === 'upvote').length;
        const downVotes = article.votes.filter(vote => vote.voteType === 'downvote').length;
        const articleWithThemes = {
            ...article.toObject(),
            themes: themeHierarchy,
            authorInfo: authorInfo,
            userVote: userVote,
            upVotes: upVotes,
            downVotes: downVotes
        };

        res.json(articleWithThemes);
    } catch (err) {
        console.error('Error al obtener el artículo:', err);
        res.status(500).json({ message: 'Error al obtener el artículo' });
    }
};


//Get de artículos por usuario
exports.getArticlesByUser = async (req, res) => {
    try {
        const { authorId, viewerId } = req.query;

        let articlesQuery = Article.find({ author: authorId }).lean();
        const articles = await articlesQuery;

        const articlesWithDetails = await Promise.all(
            articles.map(async (article) => {

                let userVote = null;
                if (viewerId) {
                    const userVoteObj = article.votes.find(
                        (vote) => vote.user.toString() === viewerId
                    );
                    userVote = userVoteObj ? userVoteObj.voteType : null;
                }

                const upVotes = article.votes.filter(
                    (vote) => vote.voteType === 'upvote'
                ).length;
                const downVotes = article.votes.filter(
                    (vote) => vote.voteType === 'downvote'
                ).length;

                let themes = null;
                if (article.theme) {
                    themes = await getThemeHierarchyById(article.theme);
                }

                const authorInfo = await getUserInfoById(article.author);

                return {
                    ...article,
                    userVote,
                    upVotes,
                    downVotes,
                    themes,
                    authorInfo,
                    votes: undefined
                };
            })
        );

        return res.status(200).json(articlesWithDetails);

    } catch (error) {
        console.error('Error al obtener artículos por usuario:', error);
        return res
            .status(500)
            .json({ message: 'Error al obtener artículos por usuario', error: error.message });
    }
};


exports.eliminarArticulo = async (req, res) => {
    try {
        const { articleId, userId } = req.query;

        const articulo = await Article.findById(articleId);
        if (!articulo) {
            return res.status(404).json({ message: 'Artículo no encontrado.' });
        }

        if (articulo.author.toString() !== userId) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este artículo.' });
        }

        // Eliminar el archivo PDF asociado al artículo
        const pdfPath = path.join(__dirname, '..', articulo.pdfUrl);
        fs.unlink(pdfPath, (err) => {
            if (err) {
                console.error('Error al eliminar el archivo PDF:', err);
            }
        });

        await Article.findByIdAndDelete(articleId);

        res.status(200).json({ message: 'Artículo eliminado con éxito.' });

    } catch (error) {
        console.error('Error al eliminar el artículo:', error);
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};


//Función con las reglas de publicación por reputación
function puedePublicar(user) {
    const ahora = new Date();
    const ultimaPublicacion = user.fechaUltimaPublicacion;
    let limitePublicaciones = 0;

    if (user.reputacion >= 0 && user.reputacion <= 14) {
        return false; // No puede publicar
    } else if (user.reputacion >= 15 && user.reputacion <= 30) {
        limitePublicaciones = 1; // 1 vez al mes
    } else if (user.reputacion >= 31 && user.reputacion <= 50) {
        limitePublicaciones = 2; // 2 veces al mes
    } else if (user.reputacion >= 51 && user.reputacion <= 70) {
        limitePublicaciones = 4; // 4 veces al mes
    } else if (user.reputacion >= 71 && user.reputacion <= 100) {
        return true; // Sin límite
    }

    if (!ultimaPublicacion) {
        return true; // Nunca ha publicado
    }

    const unMes = 30 * 24 * 60 * 60 * 1000; // Milisegundos en un mes
    const tiempoDesdeUltimaPublicacion = ahora - ultimaPublicacion;

    return tiempoDesdeUltimaPublicacion >= unMes;
};

//Función con las reglas de votación por reputación
function puedeVotar(user) {
    const ahora = new Date();
    const ultimoVoto = user.fechaUltimoVoto;
    let limiteVotos = 0;

    if (user.reputacion >= 0 && user.reputacion <= 14) {
        return false; // No puede votar
    } else if (user.reputacion >= 15 && user.reputacion <= 30) {
        limiteVotos = 1; // 1 vez a la semana
    } else if (user.reputacion >= 31 && user.reputacion <= 50) {
        limiteVotos = 3; // 3 veces a la semana
    } else if (user.reputacion >= 51 && user.reputacion <= 70) {
        limiteVotos = 5; // 5 veces a la semana
    } else if (user.reputacion >= 71 && user.reputacion <= 100) {
        return true; // Sin límite de votos
    }

    if (!ultimoVoto) {
        return true; // Nunca ha votado
    }

    const unaSemana = 7 * 24 * 60 * 60 * 1000; // Milisegundos en una semana
    const tiempoDesdeUltimoVoto = ahora - ultimoVoto;

    return tiempoDesdeUltimoVoto >= unaSemana;
};


