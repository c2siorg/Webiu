const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const contributorRoutes = require('./routes/contributorRoutes');
const projectRoutes = require('./routes/projectRoutes');
const authRoutes = require('./routes/authRoutes')
const connectDB = require('./config/db');


const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Route for API-testing
app.get('/api/v1/test', (req, res) => {
    res.status(200).json({ message: 'Server is running and working fine!' });
});

app.use('/api/v1/project', projectRoutes);
app.use('/api/contributor',contributorRoutes);
app.use('/api/v1/auth',authRoutes)



module.exports = app;
