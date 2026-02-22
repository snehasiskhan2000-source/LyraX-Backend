const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, FRONTEND_URL } = process.env;

// --- FIX FOR UPTIME ROBOT (404 Error Fix) ---
app.get('/', (req, res) => {
    res.status(200).send("LyraX Backend is Alive & Awake!");
});

// Spotify Login Route
app.get('/login', (req, res) => {
    const scope = 'user-read-playback-state user-modify-playback-state streaming user-read-email user-read-private';
    res.redirect('https://accounts.spotify.com/authorize?' + 
        new URLSearchParams({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: scope,
            redirect_uri: REDIRECT_URI
        }).toString());
});

// Callback Route
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        // Sends token back to your UI
        res.redirect(`${FRONTEND_URL}?token=${response.data.access_token}`);
    } catch (error) {
        res.status(500).send("Auth Failed. Check Render Environment Variables.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LyraX running on port ${PORT}`));
