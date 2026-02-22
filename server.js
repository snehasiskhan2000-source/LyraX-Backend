const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { RAPIDAPI_KEY, RAPIDAPI_HOST, MONGO_URI, YT_API_HOST } = process.env;

// --- MONGODB CONNECTION ---
mongoose.connect(MONGO_URI)
    .then(() => console.log("LyraX Database Connected"))
    .catch(err => console.log("DB Error:", err));

// Song Schema
const SongSchema = new mongoose.Schema({
    trackId: String,
    name: String,
    artist: String,
    image: String
});
const Favorite = mongoose.model('Favorite', SongSchema);

// Search Route (Spotify23)
app.get('/api/search', async (req, res) => {
    try {
        const response = await axios.get(`https://${RAPIDAPI_HOST}/search/`, {
            params: { q: req.query.q, type: 'tracks' },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST }
        });
        res.json(response.data.tracks.items);
    } catch (error) { res.status(500).send("Search Error"); }
});

// Audio Route (YouTube RapidAPI)
app.get('/api/audio', async (req, res) => {
    try {
        const response = await axios.get(`https://${YT_API_HOST}/search`, {
            params: { query: req.query.name + " " + req.query.artist },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': YT_API_HOST }
        });
        res.json({ url: response.data.link }); // Simplified for example
    } catch (error) { res.status(500).send("Audio Error"); }
});

// Save Favorite to MongoDB
app.post('/api/favorites', async (req, res) => {
    const fav = new Favorite(req.body);
    await fav.save();
    res.json({ message: "Saved!" });
});

app.listen(process.env.PORT || 3000);
