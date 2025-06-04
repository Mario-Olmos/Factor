const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    parentTheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theme',
        default: null, // null para temáticas principales
    },
    subthemes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Theme'
        }
    ]
});

const Theme = mongoose.model('Theme', themeSchema);
module.exports = Theme;
