const Article = require('../models/Article');

exports.uploadArticle = async (req, res) => {
    try {
        const { title, description, author, theme } = req.body;

        // URL del PDF subido
        const pdfUrl = `/uploads/pdf/${req.file.filename}`;

        // Crear el artículo con la URL del PDF
        const newArticle = new Article({
            title,
            description,
            pdfUrl,
            author,
            theme
        });

        await newArticle.save();

        res.status(201).json(newArticle);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error subiendo el PDF' });
    }
};
