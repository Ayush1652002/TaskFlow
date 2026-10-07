const mongoose = require('mongoose');
// changed
const dbConn = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (err) {
    // Stop the process on purpose. Otherwise the server would stay alive but
    // never start listening, and the host would only show a confusing timeout.
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = dbConn;
