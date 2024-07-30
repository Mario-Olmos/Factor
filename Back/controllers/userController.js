const User = require('../models/User');

exports.createUser = async (req, res) => {
    const { nombre, apellidos, email, password, fechaNacimiento, rol, acreditaciones } = req.body;
    
    const user = new User({
        nombre,
        apellidos,
        email,
        password,
        fechaNacimiento,
        rol,
        acreditaciones: rol === 'Autor' ? acreditaciones : [],
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
