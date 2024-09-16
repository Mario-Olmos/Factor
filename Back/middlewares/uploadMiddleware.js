const multer = require('multer');

// Configuración de Multer para subir archivos PDF
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/pdf'); // Carpeta donde se guardarán los PDFs
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname); // Nombre único para evitar duplicados
    }
});

const fileFilter = (req, file, cb) => {
    // Aceptar solo PDFs
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDFs are allowed!'), false);
    }
};

// Multer middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // Limitar a 5MB
});

module.exports = upload.single('pdf');
