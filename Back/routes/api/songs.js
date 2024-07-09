const router = require('express').Router();

const Song = require('../../models/song.model');

router.get('/', async (req, res) => {
    try{
        const songs = await Song.find();
        res.json(songs);
    } catch (error) {
        res.json({ error: error.message});
    }
});

router.get('/:songId', async (req, res) => {
    const { songId } = req.params;
    const song = await Song.findById(songId);
    res.json(song);
});

module.exports = router;