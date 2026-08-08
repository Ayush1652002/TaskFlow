const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const googleClient = require('../utils/googleClient');
const sendEmail = require('../utils/mailer');
const generateOtp = require('../utils/generateOtp');
const PendingInvite = require('../models/PendingInvite');
const Workspace = require('../models/Workspace');

// Sets the httpOnly refresh-token cookie and the readable CSRF cookie together,
// since every place that issues a refresh token needs both.
const setAuthCookies = (res, refreshToken) => {
  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie('csrfToken', csrfToken, {
    httpOnly: false, // must be readable by frontend JS to echo back in a header
    secure: true,
    sameSite: 'None',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Shared by login/Google/guest — signs both tokens, stores the refresh
// token on the user doc, sets cookies, and returns what the JSON response needs.
const issueSession = async (res, user) => {
  const accessToken = jwt.sign(
    { id: user._id, name: user.name },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  user.refreshTokens.push(refreshToken);
  await user.save();

  setAuthCookies(res, refreshToken);

  return accessToken;
};

// Called once a user's email is verified — joins them to any workspace
// they were invited to before they had an account.
const applyPendingInvites = async (user) => {
  const invites = await PendingInvite.find({ email: user.email });
  for (const invite of invites) {
    const workspace = await Workspace.findById(invite.workspace);
    if (workspace && !workspace.members.some(m => m.user.toString() === user._id.toString())) {
      workspace.members.push({ user: user._id, role: invite.role });
      await workspace.save();
    }
  }
  if (invites.length) await PendingInvite.deleteMany({ email: user.email });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new AppError('All fields required', 400);

  const duplicate = await User.findOne({ email });
  if (duplicate) throw new AppError('Email already exists', 409);

  const hashedPassword = await bcrypt.hash(password, 10);
  const otpCode = generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    name, email, password: hashedPassword,
    isVerified: false, otpCode, otpExpires,
  });

  await sendEmail({
    to: email,
    subject: 'Verify your TaskFlow account',
    html: `<p>Hi ${name},</p><p>Your verification code is:</p><h2>${otpCode}</h2><p>This code expires in 10 minutes.</p>`,
  });

  res.status(201).json({ message: `Verification code sent to ${email}` });
});

// POST /auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new AppError('Email and code are required', 400);

  const user = await User.findOne({ email });
  if (!user) throw new AppError('User not found', 404);
  if (user.isVerified) throw new AppError('Account already verified', 400);

  if (!user.otpCode || user.otpCode !== otp) throw new AppError('Invalid code', 400);
  if (user.otpExpires < new Date()) throw new AppError('Code expired, please request a new one', 400);

  user.isVerified = true;
  user.otpCode = null;
  user.otpExpires = null;
  await user.save();

  await applyPendingInvites(user);

  const accessToken = await issueSession(res, user);
  res.json({ accessToken, name: user.name, id: user._id });
});

// POST /auth/resend-otp
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Email is required', 400);

  const user = await User.findOne({ email });
  if (!user) throw new AppError('User not found', 404);
  if (user.isVerified) throw new AppError('Account already verified', 400);

  user.otpCode = generateOtp();
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendEmail({
    to: email,
    subject: 'Your new TaskFlow verification code',
    html: `<p>Your new verification code is:</p><h2>${user.otpCode}</h2><p>This code expires in 10 minutes.</p>`,
  });

  res.json({ message: 'A new code has been sent' });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('All fields required', 400);

  const user = await User.findOne({ email });
  if (!user || !user.password) throw new AppError('Invalid credentials', 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid credentials', 401);

  if (!user.isVerified) throw new AppError('Please verify your email before logging in', 403);

  const accessToken = await issueSession(res, user);
  res.json({ accessToken, name: user.name, id: user._id });
});

// GET /auth/google — redirect the browser to Google's consent screen
const googleAuth = (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent',
  });
  res.redirect(url);
};

// GET /auth/google/callback — Google redirects here with a one-time ?code
const googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) throw new AppError('Missing authorization code', 400);

  const { tokens } = await googleClient.getToken(code);
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload(); // { sub, email, name, ... }

  let user = await User.findOne({ googleId: payload.sub });

  if (!user) {
    // If someone already registered that email/password, link this Google
    // login to the same account instead of creating a duplicate.
    user = await User.findOne({ email: payload.email });
    if (user) {
      user.googleId = payload.sub;
    } else {
      user = new User({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        googleId: payload.sub,
        isVerified: true, // Google already verified this email for us
      });
    }
    await user.save();
    await applyPendingInvites(user);
  }

  const accessToken = await issueSession(res, user);

  // Cross-domain setup (Vercel frontend + Render backend) means the refresh
  // cookie won't be sent back by the browser due to third-party cookie blocking.
  // Solution: pass the accessToken in the redirect URL so the frontend can
  // pick it up directly without needing to call /auth/refresh.
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}?token=${accessToken}&name=${encodeURIComponent(user.name)}&id=${user._id}`);
});

// POST /auth/guest — no email/password needed, creates a throwaway account
const guestLogin = asyncHandler(async (req, res) => {
  const guestNumber = Math.floor(1000 + Math.random() * 9000);
  const user = await User.create({
    name: `Guest${guestNumber}`,
    isGuest: true,
    isVerified: true,
  });

  const accessToken = await issueSession(res, user);
  res.json({ accessToken, name: user.name, id: user._id, isGuest: true });
});

const refresh = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) throw new AppError('Unauthorized', 401);
  const oldRefreshToken = cookies.jwt;

  // Verify signature/expiry first, synchronously via try/catch instead of
  // the callback style, since we need the decoded id before touching the DB.
  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = await User.findById(decoded.id);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const tokenIsCurrentlyValid = user.refreshTokens.includes(oldRefreshToken);

  if (!tokenIsCurrentlyValid) {
    // This token was signed correctly (so it came from a real past login)
    // but isn't in the user's active list — meaning it was already rotated
    // away. Someone is replaying an old refresh token, most likely because
    // it was stolen. Revoke every active session for this user as a precaution.
    user.refreshTokens = [];
    await user.save();
    return res.status(403).json({ message: 'Refresh token reuse detected — all sessions revoked' });
  }

  // Rotate: remove the old token, issue and store a new one
  const newRefreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  user.refreshTokens = user.refreshTokens.filter(t => t !== oldRefreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  const accessToken = jwt.sign(
    { id: user._id, name: user.name },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  setAuthCookies(res, newRefreshToken);

  res.json({ accessToken, name: user.name, id: user._id });
});

const logout = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204);

  const refreshToken = cookies.jwt;
  const user = await User.findOne({ refreshTokens: refreshToken });
  if (user) {
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    await user.save();
  }

  res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
  res.clearCookie('csrfToken', { httpOnly: false, sameSite: 'None', secure: true });
  res.json({ message: 'Logged out' });
});

module.exports = { register, login, refresh, logout, googleAuth, googleCallback, guestLogin, verifyOtp, resendOtp };