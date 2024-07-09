const { model, Schema } = require('mongoose');

const songSchema = new Schema({
    title: String,
    artist: String,
    duration: Number,
    isExplicit: Boolean
})

module.exports = model('song', songSchema);