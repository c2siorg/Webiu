const dotenv = require('dotenv');
const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const contributorRoutes = require('./routes/contributorRoutes'); 
const authRoutes = require('./routes/authRoutes'); 
const connectDB = require('./config/db'); 
const bodyParser = require('body-parser');

dotenv.config(); 

const app = express(); 
app.use(cors({
    origin: 'https://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true,
}));

app.use(express.json());
app.use(bodyParser.json());

connectDB();

app.use('/api/contributor', contributorRoutes);
app.use('/api/auth', authRoutes);

const options = {
    key: fs.readFileSync('D:/Webui-2/Webiu/localhost-key.pem'),
    cert: fs.readFileSync('D:/Webui-2/Webiu/localhost.pem'),
};

const PORT = process.env.PORT || 5000;
https.createServer(options, app).listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});
