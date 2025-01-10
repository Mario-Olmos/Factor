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
            _id: { $in: temasIds },  
            subthemes: { $exists: true, $size: 0 }  
        });

        const temasFiltrados = temasNodosHoja.slice(0, limit);

        return res.status(200).json(temasFiltrados);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los temas', error: error.message });
    }
};


//Método para devolver la línea jerárquica de un tema a partir de su id
exports.getThemeHierarchyById = async (themeId) => {
    try {
        
        const themeLevel3 = await Theme.findById(themeId).populate('parentTheme');

        if (!themeLevel3) return null;

        const themeLevel2 = themeLevel3.parentTheme
            ? await Theme.findById(themeLevel3.parentTheme._id).populate('parentTheme')
            : null;

        const themeLevel1 = themeLevel2 && themeLevel2.parentTheme
            ? await Theme.findById(themeLevel2.parentTheme._id)
            : null;

        return {
            nivel1: themeLevel1 ? themeLevel1.name : null,
            nivel2: themeLevel2 ? themeLevel2.name : null,
            nivel3: themeLevel3 ? themeLevel3.name : null,
        };
    } catch (err) {
        console.error('Error obteniendo jerarquía del tema:', err);
        throw new Error('No se pudo obtener la jerarquía del tema');
    }
};


//Método BFS o búsqueda en anchura, (devuelve todos los temas de tercer nivel a partir de uno de 1 o 2 nivel)
exports.getAllDescendantThemeIds = async(rootThemeId) =>{

    let queue = [rootThemeId];

    let allIds = new Set();
  
    while (queue.length > 0) {
      const currentId = queue.shift(); 
      const currentTheme = await Theme.findById(currentId).lean();
      if (!currentTheme) continue;
  
      allIds.add(currentTheme._id.toString());
  
      if (currentTheme.subthemes && currentTheme.subthemes.length > 0) {
        for (const st of currentTheme.subthemes) {
          queue.push(st);
        }
      }
    }
    return Array.from(allIds);
  }

