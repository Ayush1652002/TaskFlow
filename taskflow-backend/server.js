require('dotenv').config();
const mongoose = require('mongoose');
const dbConn = require('./config/dbConn');
const app = require('./app');

const PORT = process.env.PORT || 3500;

dbConn();

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
