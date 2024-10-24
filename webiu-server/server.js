const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const contributorRoutes = require('./routes/contributorRoutes'); 

dotenv.config(); 

const app = express(); 
app.use(cors());

app.use(express.json());


app.use('/api/contributor', contributorRoutes);

const PORT = process.env.PORT || 5000;


const server = app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
});
