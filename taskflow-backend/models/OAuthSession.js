const mongoose = require('mongoose');

// One-time login code for Google sign-in.
// After Google confirms the user, the backend saves a random code here and
// redirects to the frontend with ONLY that code in the URL (never the real
// access token). The frontend swaps the code for tokens with
// POST /auth/google/exchange. The code works once and expires after 60 seconds.
const oauthSessionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 }, // MongoDB deletes it automatically
});
// changed
module.exports = mongoose.model('OAuthSession', oauthSessionSchema);
