const Theme = require('../models/Theme');
const Article = require('../models/Article');

//Crea un tema
exports.createTheme = async (req, res) => {
    try {
        const { name, parentTheme } = req.body;

        const existingTheme = await Theme.findOne({ name });
        if (existingTheme) {
            return res.status(409).json({ error: 'La temática ya existe' });
        }

        let newTheme;
        if (parentTheme) {
            const parentObject = await Theme.findOne({ name: parentTheme });

            console.log(parentObject.name);
            if (!parentObject) {
                return res.status(404).json({ error: 'La temática padre no existe' });
            }

            newTheme = new Theme({
                name,
                parentTheme: parentObject._id
            });

            await newTheme.save();

            parentObject.subthemes.push(newTheme._id);
            await parentObject.save();

        } else {
            newTheme = new Theme({ name });
            await newTheme.save();
        }

        res.status(201).json(newTheme);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear el tema' });
    }
};


//Devuelve todos los temas en estructura jerárquica, usado en los dropdown
exports.getThemes = async (req, res) => {
    try {
        const themes = await Theme.find({ parentTheme: null })
            .populate({
                path: 'subthemes',
                populate: {
                    path: 'subthemes',
                    model: 'Theme',
                    populate: {
                        path: 'subthemes',
                        model: 'Theme'
                    }
                }
            });

        res.status(200).json(themes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener las temáticas' });
    }
};

// Ruta para obtener temas de tercer nivel con artículos recientes
exports.getTrendyThemes = async (req, res) => {
    try {
        const { limit, days } = req.query;
        const diasAtras = new Date();
        diasAtras.setDate(diasAtras.getDate() - days);

        // Buscar artículos recientes (últimos x días)
        const articulosRecientes = await Article.find({
            createdAt: { $gte: diasAtras }
        })

        const temasIds = articulosRecientes.map(article => article.theme);

        const temasNodosHoja = await Theme.find({
            _id: { $in: temasIds },  // Solo los temas asociados a los artículos recientes
            subthemes: { $exists: true, $size: 0 }  // Filtrar solo los que no tienen subtemas
        });

        const temasFiltrados = temasNodosHoja.slice(0, limit);

        return res.status(200).json(temasFiltrados);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los temas', error: error.message });
    }
};

