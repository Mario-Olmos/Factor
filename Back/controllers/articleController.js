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
        });

        if (user.reputacion >= 50) {
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

        // Verificación de que el usuario tiene reputación suficiente
        const usuario = await User.findById(user);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        if (usuario.reputacion < 50) { // Puedes ajustar el mínimo de reputación
            return res.status(403).json({ message: 'No tienes suficiente reputación para votar' });
        }

        // Encontrar el artículo
        const articulo = await Article.findById(articleId);
        if (!articulo) {
            return res.status(404).json({ message: 'Artículo no encontrado' });
        }

        // Verificar si el usuario ya ha votado este artículo
        const votoExistente = articulo.votes.find(vote => vote.user.toString() === usuario._id.toString());

        if (votoExistente) {
            return res.status(400).json({ message: 'Ya has votado este artículo' });
        }

        // Definir cómo se afectará la veracidad
        const cambioVeracidad = voteType === 'upvote' ? pesoVoto : -pesoVoto;

        // Actualizar el artículo: añadir el voto y ajustar la veracidad
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
            { new: true } // Devuelve el artículo actualizado
        );

        return res.status(200).json({ message: 'Voto registrado correctamente', articulo: updatedArticle });

    } catch (error) {
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};


