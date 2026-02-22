const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, FRONTEND_URL } = process.env;

app.get('/login', (req, res) => {
    const scope = 'user-read-playback-state user-modify-playback-state streaming user-read-email user-read-private';
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.redirect(authUrl);
});

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

        res.redirect(`${FRONTEND_URL}?token=${response.data.access_token}`);
    } catch (error) {
        res.status(500).send("Authentication Failed");
    }
});

app.listen(process.env.PORT || 3000);
