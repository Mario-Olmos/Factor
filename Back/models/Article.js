const mongoose = require('mongoose');

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
    updatedAt: {
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
    ]
});

// Middleware para actualizar la fecha de "updatedAt" cada vez que se guarda un artículo
articleSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;
