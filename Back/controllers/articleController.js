const Article = require('../models/Article');
const User = require('../models/User');
const path = require('path');

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
            veracity
        });

        if (user.reputation >= 50) {
            // Impulso inicial proporcional y normalizado (máximo de 10)
            newArticle.veracity = (user.reputacion / 100) * 10;
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

exports.getArticles = async (req, res) => {
    try {
        const articles = await Article.find({});
        res.status(200).json(articles);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los artículos' });
    }
};

exports.darLike = async (req, res) => {
    try {
        const { articleId, pesoVoto, user, voteType } = req.body;

        // Verificar si el usuario tiene suficiente reputación
        const usuario = await User.findById(user);

        if (usuario.reputacion < 20) {
            return res.status(403).json({
                message: 'No tienes suficiente reputación para votar en este artículo'
            });
        }

        // Obtener el artículo
        const articulo = await Article.findById(articleId);

        if (!articulo) {
            return res.status(404).json({ message: 'Artículo no encontrado' });
        }

        // Verificar si el usuario ya ha votado este artículo
        const votoExistente = articulo.votes.find(vote => vote.user.toString() === user.userId);

        if (votoExistente) {
            return res.status(400).json({ message: 'Ya has votado este artículo' });
        }

        // Calcular el impacto en la veracidad
        let cambioVeracidad;
        if (voteType === 'upvote') {
            cambioVeracidad = pesoVoto * 0.05; // Incrementar veracidad
        } else if (voteType === 'downvote') {
            cambioVeracidad = -pesoVoto * 0.05; // Disminuir veracidad
        }

        // Actualizar el artículo
        const updatedArticle = await Article.findByIdAndUpdate(
            articleId,
            {
                $inc: { veracidad: cambioVeracidad }, // Incrementar o disminuir la veracidad
                $push: {
                    votes: {
                        user: user.userId,
                        voteType: voteType,  // 'upvote' o 'downvote'
                        votedAt: new Date()
                    }
                }
            },
            { new: true } // Esto devuelve el artículo actualizado
        );

        return res.status(200).json({
            message: 'Voto registrado exitosamente',
            veracidad: updatedArticle.veracidad,
            votosTotales: updatedArticle.votes.length
        });

    } catch (error) {
        return res.status(500).json({ message: 'Error al votar', error });
    }
};

