const Theme = require('../models/Theme');

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