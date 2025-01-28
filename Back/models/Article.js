const mongoose = require('mongoose');

const authorInfoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellidos: { type: String, required: true },
    email: { type: String, required: true },
    reputacion: { type: Number, required: true },
    fechaNacimiento: { type: Date, required: true },
    acreditaciones: [
        {
            title: { type: String, required: true },
            institution: { type: String, required: true },
            year: { type: Number, required: true },
        }
    ]
}, { _id: false });

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    pdfUrl: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    authorReputationAtCreation: {
        type: Number,
        required: true,
    },
    theme: {
        type: String,
        required: true,
    },
    veracity: {
        type: Number,
        default: 0,
    },
    source: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    votes: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            voteType: {
                type: String,
                enum: ['upvote', 'downvote'],
                required: true,
            },
            votedAt: {
                type: Date,
                default: Date.now,
            }
        }
    ],
    authorInfo: { type: authorInfoSchema },
    deleted: { type: Boolean, default: false }
});

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;
