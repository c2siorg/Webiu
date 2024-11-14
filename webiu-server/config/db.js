const mongoose = require('mongoose');
require('dotenv').config();
const colors = require('colors');


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connection established successfully.'.green.bold.underline);
      } catch (error) {
        console.error('Error: MongoDB connection failed. Please check the database server and configuration.'.red.bold.underline);
        process.exit(1);
  }
};

module.exports = connectDB;
