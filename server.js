const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, FRONTEND_URL, RAPIDAPI_KEY, RAPIDAPI_HOST } = process.env;

// Health Check for UptimeRobot
app.get('/', (req, res) => res.status(200).send("LyraX Blue Active"));

app.get('/login', (req, res) => {
    const scope = 'user-read-playback-state user-modify-playback-state streaming user-read-email user-read-private';
    res.redirect('https://accounts.spotify.com/authorize?' + 
        new URLSearchParams({ response_type: 'code', client_id: CLIENT_ID, scope, redirect_uri: REDIRECT_URI }).toString());
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, client_id: CLIENT_ID, client_secret: CLIENT_SECRET
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        res.redirect(`${FRONTEND_URL}?token=${response.data.access_token}`);
    } catch (error) {
        res.status(500).send("Auth Failed");
    }
});

// --- NEW: RAPIDAPI LYRICS ROUTE ---
app.get('/lyrics', async (req, res) => {
    const { track_id } = req.query;
    try {
        const options = {
            method: 'GET',
            url: `https://${RAPIDAPI_HOST}/track_lyrics`, // Verify this endpoint on your RapidAPI dashboard
            params: { id: track_id },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST }
        };
        const response = await axios.request(options);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Lyrics unavailable" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running`));
