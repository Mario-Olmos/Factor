const multer = require('multer');

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname); // Nombre único para las imágenes
    }
});

const imageFilter = (req, file, cb) => {
    // Aceptar solo imágenes (jpg, jpeg, png, gif)
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Middleware específico para imágenes
const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = uploadImage.single('imagenPerfil');
