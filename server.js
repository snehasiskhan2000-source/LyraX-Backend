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

// --- DATABASE & USER MODEL ---
mongoose.connect(MONGO_URI).then(() => console.log("LyraX DB Active"));

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    favorites: Array
});
const User = mongoose.model('User', UserSchema);

// --- AUTH ROUTES ---
app.post('/auth/signup', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    try {
        const user = await User.create({ email: req.body.email, password: hashedPassword });
        res.json({ message: "User Created" });
    } catch (e) { res.status(400).json({ error: "Email exists" }); }
});

app.post('/auth/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token });
    } else { res.status(401).json({ error: "Invalid Credentials" }); }
});

// --- MIDDLEWARE TO PROTECT ROUTES ---
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send("No Token");
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).send("Invalid Token");
        req.userId = decoded.userId;
        next();
    });
};

// --- PROTECTED MUSIC ROUTES ---
app.get('/api/search', authenticate, async (req, res) => {
    const response = await axios.get(`https://${SPOTIFY_HOST}/search/`, {
        params: { q: req.query.q, type: 'tracks' },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': SPOTIFY_HOST }
    });
    res.json(response.data.tracks.items);
});

app.get('/api/stream', authenticate, async (req, res) => {
    const { title, artist } = req.query;
    const search = await axios.get(`https://${YT_HOST}/search_video`, {
        params: { query: `${title} ${artist} audio`, limit: 1 },
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': YT_HOST }
    });
    const videoId = search.data.result[0].id;
    const download = await axios.get(`https://${YT_HOST}/get_mp3_download_link/${videoId}`, {
        headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': YT_HOST }
    });
    res.json({ url: download.data.link });
});

app.listen(process.env.PORT || 3000);
