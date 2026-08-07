const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // Not required at the schema level anymore — guests have no email, and
  // controllers enforce "email+password required" only for normal register.
  email: {
    type: String,
    unique: true,
    sparse: true, // lets multiple docs have no email without violating the unique index
  },
  // Optional: Google accounts and guests never set this.
  password: {
    type: String,
  },
  // Set only for accounts created via "Continue with Google".
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  // Set only for accounts created via "Continue as Guest" — no email/password,
  // temporary by convention (frontend nudges them to "upgrade" from Settings).
  isGuest: {
    type: Boolean,
    default: false,
  },
  // Only normal email/password registrations start unverified — Google
  // accounts are pre-verified by Google, guests have no email to verify.
  isVerified: {
    type: Boolean,
    default: false,
  },
  otpCode: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  refreshTokens: {
    type: [String],
    default: [],
  },
  defaultPriority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);