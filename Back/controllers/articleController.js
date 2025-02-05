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
        const { title, description, theme, source } = req.body;
        const user = await User.findById(req.user.userId);

        if (!source) {
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, () => { });
            }
            return res.status(400).json({ message: 'La fuente es requerida.' });
        }

        if (!user) {
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, () => { });
            }
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (user.reputacion < 15) {
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, () => { });
            }
            return res.status(403).json({ message: 'No tienes suficiente reputación para publicar un artículo.' });
        }

        const publicationLimit = getPublicationLimit(user.reputacion);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const publicacionesUltimoMes = await Article.countDocuments({
            author: user._id,
            createdAt: { $gte: oneMonthAgo }
        });
        console.log(publicacionesUltimoMes);

        if (publicacionesUltimoMes >= publicationLimit) {
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, () => { });
            }
            return res.status(403).json({
                message: 'Has alcanzado el límite de publicaciones permitidas para tu nivel de reputación.'
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'El archivo PDF es requerido.' });
        }
        const pdfUrl = `/uploads/pdf/${req.file.filename}`;

        const newArticle = new Article({
            title,
            description,
            pdfUrl,
            author: user._id,
            theme,
            source
        });

        if (user.reputacion >= 30) {
            newArticle.veracity = Math.min(6, user.reputacion / 10);
        }

        await newArticle.save();

        user.fechaUltimaPublicacion = new Date();
        await user.save();

        res.status(201).json({
            message: 'Artículo creado con éxito.',
            article: {
                _id: newArticle._id,
                title: newArticle.title,
                description: newArticle.description,
                pdfUrl: newArticle.pdfUrl,
                theme: newArticle.theme,
                veracity: newArticle.veracity,
                createdAt: newArticle.createdAt,
                source: newArticle.source
            }
        });

    } catch (err) {
        console.error('Error al crear el artículo:', err);

        // Eliminar el archivo PDF si ocurre un error
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => { });
        }

        res.status(500).json({ error: 'Error subiendo el PDF o creando el artículo.' });
    }
};


//Método para obetener los artículos del feed, con el voto del usuario logeado y jerarquía de temas
exports.obtenerArticulosFeed = async (req, res) => {
    try {
        const { page = 1, limit = 10, tema, ordenarPorFecha, ordenarPorVeracidad, days } = req.query;
        const userId = req.user.userId;

        const fechaLimite = new Date();
        if (days) {
            fechaLimite.setDate(fechaLimite.getDate() - Number(days));
        } else {
            fechaLimite.setDate(fechaLimite.getDate() - 100);
        }

        let query = {
            veracity: { $gt: -1 },
            createdAt: { $gte: fechaLimite }
        };

        if (tema) {
            const allThemeIds = await getAllDescendantThemeIds(tema);
            query.theme = { $in: allThemeIds };
        }

        let articlesQuery = Article.find(query).lean();

        if (ordenarPorVeracidad || ordenarPorFecha) {
            if (ordenarPorVeracidad) {
                articlesQuery = articlesQuery.sort({ veracity: ordenarPorVeracidad === 'asc' ? 1 : -1 });
            }
            if (ordenarPorFecha) {
                articlesQuery = articlesQuery.sort({ createdAt: ordenarPorFecha === 'asc' ? 1 : -1 });
            }
            const articles = await articlesQuery
                .skip((page - 1) * limit)
                .limit(Number(limit));

            const articlesWithDetails = await Promise.all(
                articles.map(async (article) => {
                    const author = await User.findById(article.author);
                    const userVoteObj = article.votes.find(vote => vote.user.toString() === userId);
                    return getResponseObject(author, article, userVoteObj);
                })
            );
            return res.status(200).json(articlesWithDetails);
        } else {
            const articles = await articlesQuery.exec();
            const currentTime = new Date();
            const processedArticles = articles.map(article => {
                const ageDays = (currentTime - new Date(article.createdAt)) / (1000 * 60 * 60 * 24);
                const freshnessScore = Math.max(0, 30 - ageDays);
                let evaluatedScore = 0;
                if (article.evaluated === 'verificado') {
                    evaluatedScore = 3;
                } else if (article.evaluated === 'pocoFiable') {
                    evaluatedScore = -3;
                }
                article.compositeScore = article.veracity + freshnessScore + evaluatedScore;
                console.log(article.title ,article.compositeScore);
                return article;
            });

            processedArticles.sort((a, b) => b.compositeScore - a.compositeScore);
            const startIndex = (page - 1) * limit;
            const paginatedArticles = processedArticles.slice(startIndex, startIndex + Number(limit));

            const articlesWithDetails = await Promise.all(
                paginatedArticles.map(async (article) => {
                    const author = await User.findById(article.author);
                    const userVoteObj = article.votes.find(vote => vote.user.toString() === userId);
                    return getResponseObject(author, article, userVoteObj);
                })
            );
            return res.status(200).json(articlesWithDetails);
        }
    } catch (error) {
        console.error('Error al cargar el feed de artículos:', error);
        return res.status(500).json({ message: 'Error al cargar el feed de artículos', error: error.message });
    }
};


exports.darLike = async (req, res) => {
    try {
        const { articleId, pesoVoto, voteType } = req.body;

        if (!['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({ message: 'Tipo de voto inválido.' });
        }

        const usuario = await User.findById(req.user.userId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (usuario.reputacion < 15) {
            return res.status(403).json({ message: 'No tienes suficiente reputación para votar.' });
        }

        const votingLimit = getVotingLimit(usuario.reputacion);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Contar las votaciones realizadas en la última semana
        const votacionesUltimaSemana = await Article.countDocuments({
            "votes.user": usuario._id,
            "votes.votedAt": { $gte: oneWeekAgo }
        });

        const articulo = await Article.findById(articleId);
        if (!articulo) {
            return res.status(404).json({ message: 'Artículo no encontrado.' });
        }

        const votoExistente = articulo.votes.find(vote => vote.user.toString() === usuario._id.toString());
        if (votoExistente) {
            return res.status(400).json({ message: 'Ya has votado este artículo.' });
        }

        console.log(votacionesUltimaSemana);
        if (votacionesUltimaSemana >= votingLimit) {
            return res.status(403).json({
                message: 'Has alcanzado el límite de votaciones permitidas para tu nivel de reputación.'
            });
        }

        const cambioVeracidad = voteType === 'upvote' ? pesoVoto : -pesoVoto;
        const pesoPool = getPesoPool(usuario.reputacion);
        const currentPoolTotal = articulo.votes.reduce((sum, voto) => sum + voto.pesoPool, 0);
        const newPoolTotal = currentPoolTotal + pesoPool;
        let categoria = null;

        if (newPoolTotal >= 10 && articulo.categorizationRounds === 0) {
            // Primera ronda de categorización
            const balanceVotos = articulo.votes.reduce((sum, voto) => {
                return sum + (voto.voteType === 'upvote' ? voto.pesoPool : -voto.pesoPool);
            }, 0) + (voteType === 'upvote' ? pesoPool : -pesoPool);

            const diferenciaAbs = Math.abs(balanceVotos);
            const porcentajeDiferencia = (diferenciaAbs / newPoolTotal) * 100;

            if (balanceVotos > 0 && porcentajeDiferencia > 10) {
                categoria = 'verificado';
            } else if (balanceVotos < 0 && porcentajeDiferencia > 10) {
                categoria = 'desinformativo';
            } else {
                categoria = 'neutro';
            }

            if (categoria !== null) {
                articulo.categorizationRounds += 1;
            }

        } else if (newPoolTotal >= 30 && articulo.categorizationRounds === 1) {
            const balanceVotos = articulo.votes.reduce((sum, voto) => {
                return sum + (voto.voteType === 'upvote' ? voto.pesoPool : -voto.pesoPool);
            }, 0) + (voteType === 'upvote' ? pesoPool : -pesoPool);

            const diferenciaAbs = Math.abs(balanceVotos);
            const porcentajeDiferencia = (diferenciaAbs / newPoolTotal) * 100;

            if (balanceVotos > 0 && porcentajeDiferencia > 10) {
                categoria = 'verificado';
            } else if (balanceVotos < 0 && porcentajeDiferencia > 10) {
                categoria = 'desinformativo';
            } else {
                categoria = 'neutro';
            }

            if (categoria !== null) {
                articulo.categorizationRounds += 1;
            }
        }

        const nuevoVoto = {
            user: usuario._id,
            voteType: voteType,
            pesoPool: pesoPool,
            votedAt: new Date(),
        };

        let updateFields = {
            $inc: { veracity: cambioVeracidad },
            $push: { votes: nuevoVoto },
        };

        if (categoria) {
            updateFields.$set = { evaluated: categoria };
            updateFields.$inc = { categorizationRounds: 1 };
        }

        const articuloActualizado = await Article.findByIdAndUpdate(
            articleId,
            updateFields,
            { new: true }
        );

        if (categoria) {
            await categorizarArticulo(articuloActualizado, categoria);
        }

        usuario.fechaUltimoVoto = new Date();
        await usuario.save();

        return res.status(200).json({
            message: 'Voto registrado correctamente.'
        });

    } catch (error) {
        console.error('Error al dar like/dislike:', error);
        return res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};


// Detalle del artículo
exports.getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const voterId = req.user.userId;

        // Encuentra el artículo por ID
        const article = await Article.findById(id);
        if (!article) {
            return res.status(404).json({ message: 'Artículo no encontrado' });
        }
        const author = await User.findById(article.author);

        const userVoteObj = article.votes.find(vote => vote.user.toString() === voterId);

        const articleWithThemes = await getResponseObject(author, article, userVoteObj);

        res.json(articleWithThemes);
    } catch (err) {
        console.error('Error al obtener el artículo:', err);
        res.status(500).json({ message: 'Error al obtener el artículo' });
    }
};


//Get de artículos por usuario
exports.getArticlesByUser = async (req, res) => {
    try {
        const { username } = req.query;
        const viewer = await User.findById(req.user.userId);
        if (!viewer) {
            return res.status(404).json({ message: 'Viewer no encontrado.' });
        }
        const author = await User.findOne({ username: username });
        if (!author) {
            return res.status(404).json({ message: 'Autor no encontrado.' });
        }

        let articlesQuery = Article.find({ author: author._id }).lean();
        const articles = await articlesQuery;

        const articlesWithDetails = await Promise.all(
            articles.map(async (article) => {
                const userVoteObj = article.votes.find(vote => vote.user.toString() === viewer._id.toString());

                return getResponseObject(author, article, userVoteObj);
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
        const { articleId } = req.query;
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const articulo = await Article.findById(articleId);
        if (!articulo) {
            return res.status(404).json({ message: 'Artículo no encontrado.' });
        }

        if (articulo.author.toString() !== user.userId) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este artículo.' });
        }

        // Eliminar el archivo PDF asociado al artículo
        const pdfPath = path.join(__dirname, '..', articulo.pdfUrl);
        fs.unlink(pdfPath, async (err) => {
            if (err) {
                console.error('Error al eliminar el archivo PDF:', err);
                return res.status(500).json({ message: 'Error al eliminar el archivo PDF.' });
            }

            await Article.findByIdAndDelete(articleId);
            res.status(200).json({ message: 'Artículo eliminado con éxito.' });
        });

        await Article.findByIdAndDelete(articleId);

        res.status(200).json({ message: 'Artículo eliminado con éxito.' });

    } catch (error) {
        console.error('Error al eliminar el artículo:', error);
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
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

//Función que calcula el peso pool
const getPesoPool = (reputacion) => {
    if (reputacion >= 71) return 3;
    if (reputacion <= 70 && reputacion >= 31) return 1.5;
    if (reputacion <= 30) return 1;
    return 0;
};

// Función que devuelve una respuesta dependiendo si es un artículo con o sin autor
const getResponseObject = async (author, article, userVoteObj) => {
    const userVote = userVoteObj ? userVoteObj.voteType : null;
    const themes = await getThemeHierarchyById(article.theme);
    const upVotes = article.votes.filter(vote => vote.voteType === 'upvote').length;
    const downVotes = article.votes.filter(vote => vote.voteType === 'downvote').length;
    if (author) {
        try {
            const authorInfo = await getUserInfoById(author.username);
            return {
                _id: article._id,
                title: article.title,
                description: article.description,
                pdfUrl: article.pdfUrl,
                theme: article.theme,
                veracity: article.veracity,
                createdAt: article.createdAt,
                source: article.source,
                upVotes: upVotes,
                downVotes: downVotes,
                userVote: userVote,
                authorInfo: authorInfo,
                themes: themes,
                deleted: article.deleted,
                evaluated: article.evaluated
            };
        } catch (error) {
            console.error('Error al obtener la información del autor:', error);
        }
    } else {
        return {
            _id: article._id,
            title: article.title,
            description: article.description,
            pdfUrl: article.pdfUrl,
            theme: article.theme,
            veracity: article.veracity,
            createdAt: article.createdAt,
            source: article.source,
            upVotes: upVotes,
            downVotes: downVotes,
            userVote: userVote,
            authorInfo: article.authorInfo,
            themes: themes,
            deleted: article.deleted,
            evaluated: article.evaluated
        };
    }
};


async function categorizarArticulo(articulo, categoria) {
    const currentRound = articulo.categorizationRounds;

    for (const voto of articulo.votes) {
        const votante = await User.findById(voto.user);
        if (!votante) continue;

        let ajuste = 0;

        if (categoria === 'verificado') {
            if (voto.voteType === 'upvote') {
                ajuste = 2;
            } else if (voto.voteType === 'downvote') {
                ajuste = -2;
            }
        } else if (categoria === 'desinformativo') {
            if (voto.voteType === 'downvote') {
                ajuste = 2;
            } else if (voto.voteType === 'upvote') {
                ajuste = -2;
            }
        } else if (categoria === 'neutro') {
            continue;
        }

        votante.reputacion += ajuste;
        votante.reputacion = Math.max(0, Math.min(100, Math.round(votante.reputacion)));
        await votante.save();
    }

    const autor = await User.findById(articulo.author);
    if (autor) {
        if (currentRound === 1) {
            if (categoria === 'verificado') {
                autor.reputacion += 5;
            } else if (categoria === 'desinformativo') {
                autor.reputacion -= 5;
            }
        }
        autor.reputacion = Math.max(0, Math.min(100, Math.round(autor.reputacion)));

        await autor.save();
    }
}





