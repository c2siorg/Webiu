const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = require('./app');

const PORT = process.env.PORT || 5100;

const server = app.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}`);
});
