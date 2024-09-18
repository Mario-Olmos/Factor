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

            const parentThemeObject = await Theme.findById(parentTheme);
            console.log(parentThemeObject)
            if (!parentThemeObject) {
                return res.status(404).json({ error: 'La temática padre no existe' });
            }

            newTheme = new Theme({
                name,
                parentTheme: parentThemeObject.name
            });

            await newTheme.save();

            parentThemeObject.subthemes.push(newTheme._id);
            await parentTheme.save();

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