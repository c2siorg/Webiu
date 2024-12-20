
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const contributorRoutes = require('./routes/contributorRoutes'); 
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
dotenv.config(); 

const app = express(); 
app.use(cors());

app.use(express.json());


app.use('/api/contributor', contributorRoutes); 

app.get("/", (req, res) => {
    res.send("Welcome to the OAuth Login API");
});


app.get("/auth/google", (req, res) => {
    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&scope=email%20profile`;
    res.redirect(googleAuthURL);
});


app.get("/auth/google/callback", async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).json({ message: "Authorization code missing" });
    }

    try {
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code",
            }
        );

        
        console.log("Google Token response:", tokenResponse.data);

        if (tokenResponse.data.error) {
            return res.status(400).json({ message: tokenResponse.data.error_description });
        }

        const accessToken = tokenResponse.data.access_token;
        const idToken = tokenResponse.data.id_token; 

        
        console.log("Google Access Token:", accessToken);
        console.log("Google ID Token:", idToken);

        
        const userResponse = await axios.get(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
        );

        
        const oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        const ticket = await oauth2Client.verifyIdToken({
            idToken: idToken, 
            audience: process.env.GOOGLE_CLIENT_ID,  
        });

        const payload = ticket.getPayload(); 
        console.log("Verified User info:", payload);

        const user = userResponse.data;
        const redirectUrl = `http://localhost:4200?user=${encodeURIComponent(JSON.stringify(user))}`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error("Error during Google OAuth:", error);
        res.status(500).json({ message: "Error authenticating with Google", error: error.response?.data || error.message });
    }
});




app.get("/auth/github", (req, res) => {
    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=user`;
    res.redirect(githubAuthURL);
});


app.get("/auth/github/callback", async (req, res) => {
    const code = req.query.code; 


    console.log("Received authorization code:", code);

    
    console.log("Registered redirect URI:", process.env.GITHUB_REDIRECT_URI);
    if (!code) {
        return res.status(400).json({ message: "Authorization code missing" });
    }

    try {
        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            new URLSearchParams({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_REDIRECT_URI,
            }).toString(),
            {
                headers: {
                    Accept: "application/json",
                },
            }
        );

        console.log("Token response:", tokenResponse.data);  

        if (tokenResponse.data.error) {
            return res.status(400).json({ message: tokenResponse.data.error_description });
        }

        const accessToken = tokenResponse.data.access_token;

        
        const userResponse = await axios.get("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const user = userResponse.data;
        const redirectUrl = `http://localhost:4200?user=${encodeURIComponent(JSON.stringify(user))}`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error authenticating with GitHub", error: error.response?.data || error.message });
    }
});


const PORT = process.env.PORT || 5000;


const server = app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
});