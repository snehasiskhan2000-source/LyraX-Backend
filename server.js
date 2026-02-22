const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { MONGO_URI, JWT_SECRET, RAPIDAPI_KEY, SPOTIFY_HOST, YT_HOST } = process.env;

// 1. DATABASE CONNECTION
mongoose.connect(MONGO_URI).then(() => console.log("LyraX DB Active"));

const User = mongoose.model('User', new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }
}));

// 2. AUTH MIDDLEWARE
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send("Access Denied");
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) { res.status(403).send("Invalid Token"); }
};

// 3. AUTH ROUTES
app.post('/auth/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await User.create({ email: req.body.email, password: hashedPassword });
        res.json({ message: "Success" });
    } catch (e) { res.status(400).json({ error: "Email already exists" }); }
});

app.post('/auth/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } else { res.status(401).json({ error: "Wrong credentials" }); }
});

// 4. MUSIC SEARCH (Spotify23)
app.get('/api/search', authenticate, async (req, res) => {
    try {
        const response = await axios.get(`https://${SPOTIFY_HOST}/search/`, {
            params: { q: req.query.q, type: 'tracks' },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': SPOTIFY_HOST }
        });
        res.json(response.data.tracks.items);
    } catch (e) { res.status(500).send("Search Error"); }
});

// 5. AUDIO STREAMING (YouTube MP36)
app.get('/api/stream', authenticate, async (req, res) => {
    const { title, artist } = req.query;
    try {
        // Step A: Search for the video to get ID
        const search = await axios.get(`https://${YT_HOST}/search`, {
            params: { q: `${title} ${artist}` },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': YT_HOST }
        });
        const videoId = search.data[0].id; // Pulling ID from the first search result

        // Step B: Get the MP3 download link using /dl endpoint
        const download = await axios.get(`https://${YT_HOST}/dl`, {
            params: { id: videoId },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': YT_HOST }
        });
        
        // Return the link found in the YouTube MP36 response
        res.json({ url: download.data.link });
    } catch (e) { res.status(500).json({ error: "Audio fetch failed" }); }
});

app.listen(process.env.PORT || 3000, () => console.log("LyraX Universal Live"));
