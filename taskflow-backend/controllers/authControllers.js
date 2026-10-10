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
const OAuthSession = require('../models/OAuthSession');
// changed

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ROTATION_GRACE_MS = 60 * 1000; // a just-rotated token still works for 60s
const MAX_SESSIONS = 10;             // per user (phones, laptops, tabs...)

// Only the hash of a refresh token is stored in the DB, so a DB leak does not
// leak usable sessions. SHA-256 (not bcrypt): the token is long and random.
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

const signAccessToken = (user) => jwt.sign(
  { id: user._id, name: user.name },
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: '15m' }
);

const signRefreshToken = (user) => jwt.sign(
  { id: user._id, jti: crypto.randomBytes(8).toString('hex') }, // jti keeps every token unique
  process.env.REFRESH_TOKEN_SECRET,
  { expiresIn: '7d' }
);

// Sets the httpOnly refresh-token cookie and the readable CSRF cookie together,
// since every place that issues a refresh token needs both.
const setAuthCookies = (res, refreshToken) => {
  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: REFRESH_TTL_MS,
  });

  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie('csrfToken', csrfToken, {
    httpOnly: false, // must be readable by frontend JS to echo back in a header
    secure: true,
    sameSite: 'None',
    maxAge: REFRESH_TTL_MS,
  });

  // When the frontend and API are on DIFFERENT domains (Vercel + Render), the
  // frontend cannot read this cookie with document.cookie. So we also hand the
  // same value over in the JSON response (see sessionPayload) and the frontend
  // keeps it for the x-csrf-token header.
  res.locals.csrfToken = csrfToken;
};

// The JSON the frontend receives after any successful login/refresh.
const sessionPayload = (res, accessToken, user, extra = {}) => ({
  accessToken,
  name: user.name,
  id: user._id,
  csrfToken: res.locals.csrfToken,
  ...extra,
});

// Shared by login/Google/guest — signs both tokens, stores the refresh
// token on the user doc, sets cookies, and returns what the JSON response needs.
const issueSession = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // Every login/exchange creates a brand-new session. Keep the newest
  // MAX_SESSIONS so the list cannot grow forever.
  user.refreshTokens = [...user.refreshTokens, hashToken(refreshToken)].slice(-MAX_SESSIONS);
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
  res.json(sessionPayload(res, accessToken, user));
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
  res.json(sessionPayload(res, accessToken, user));
});

// GET /auth/google — redirect the browser to Google's consent screen
const googleAuth = (req, res) => {
  // "state" is a random value we remember in a cookie and Google sends back.
  // If they do not match in the callback, someone else started this login
  // (login CSRF), so we refuse it.
  const state = crypto.randomBytes(24).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax', // Lax still sends the cookie when Google redirects the browser back
    maxAge: 10 * 60 * 1000,
  });

  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent',
    state,
  });
  res.redirect(url);
};

// GET /auth/google/callback — Google redirects here with a one-time ?code
const googleCallback = asyncHandler(async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { code, state } = req.query;

  // User pressed "Cancel" on Google's screen, or Google reported an error:
  // send them back to the app instead of showing raw JSON.
  if (req.query.error || !code) return res.redirect(`${frontendUrl}/?login=cancelled`);

  const stateCookie = req.cookies?.oauth_state;
  res.clearCookie('oauth_state');
  if (!state || !stateCookie || state !== stateCookie) {
    throw new AppError('Invalid login state, please try again', 400);
  }

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

  // IMPORTANT: the access token is never put in the URL. We only pass a random
  // one-time code; the frontend swaps it for real tokens with a normal API call
  // (POST /auth/google/exchange), where the cookies are also set.
  const oneTimeCode = crypto.randomBytes(32).toString('hex');
  await OAuthSession.create({ code: oneTimeCode, user: user._id });

  res.redirect(`${frontendUrl}/?code=${oneTimeCode}`);
});

// POST /auth/google/exchange - body: { code }. The code works only once.
const exchangeGoogleCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') throw new AppError('Code is required', 400);

  // findOneAndDelete is a single step, so two requests cannot both use the same code
  const session = await OAuthSession.findOneAndDelete({ code });
  if (!session) throw new AppError('Login code is invalid or expired', 400);

  const user = await User.findById(session.user);
  if (!user) throw new AppError('User not found', 404);

  const accessToken = await issueSession(res, user);
  res.json(sessionPayload(res, accessToken, user));
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
  res.json(sessionPayload(res, accessToken, user, { isGuest: true }));
});

const clearAuthCookies = (res) => {
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
  res.clearCookie('csrfToken', { httpOnly: false, sameSite: 'None', secure: true });
};

// GET /auth/refresh - trades the httpOnly refresh cookie for a new access token.
// 401 = the session is really gone (log the user out). Anything else = try again.
const refresh = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.jwt;
  if (!oldRefreshToken) throw new AppError('Unauthorized', 401);

  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  const oldHash = hashToken(oldRefreshToken);
  const newRefreshToken = signRefreshToken({ _id: decoded.id });
  const newHash = hashToken(newRefreshToken);
  const now = new Date();
  const graceStart = new Date(now.getTime() - ROTATION_GRACE_MS);

  // ONE atomic database step: "if the old token is active, swap it for the new
  // one". If two requests race, only one can win this step - no lost updates.
  const user = await User.findOneAndUpdate(
    { _id: decoded.id, refreshTokens: oldHash },
    [{
      $set: {
        refreshTokens: {
          $concatArrays: [
            { $filter: { input: '$refreshTokens', cond: { $ne: ['$$this', oldHash] } } },
            [newHash],
          ],
        },
        rotatedTokens: {
          $concatArrays: [
            { $filter: { input: { $ifNull: ['$rotatedTokens', []] }, cond: { $gt: ['$$this.at', graceStart] } } },
            [{ old: oldHash, next: newHash, at: now }],
          ],
        },
      },
    }],
    { new: true }
  );

  if (user) {
    setAuthCookies(res, newRefreshToken);
    return res.json(sessionPayload(res, signAccessToken(user), user));
  }

  // The old token was not active. Two possible reasons:
  const existing = await User.findById(decoded.id);
  if (!existing) {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // (a) A parallel refresh (second tab / reload) JUST rotated it. Not an attack:
  //     hand back the successor token the winner created.
  const recent = (existing.rotatedTokens || []).find((r) => r.old === oldHash && r.at > graceStart);
  if (recent && existing.refreshTokens.includes(recent.next)) {
    // We cannot rebuild the raw successor token (only its hash is stored), so
    // the loser gets a new access token and keeps its current cookie. The
    // winner's response already carries the new cookie, which the browser
    // stores - both requests end up logged in.
    const accessToken = signAccessToken(existing);
    return res.json(sessionPayload(res, accessToken, existing, { graceRefresh: true }));
  }
  // Rotated recently but its successor is gone too (user logged out in between):
  // the session is simply over. Not theft, so do not touch other devices.
  if (recent) {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Session ended' });
  }

  // (b) Old token reused long after rotation: likely stolen. Revoke everything.
  await User.updateOne({ _id: decoded.id }, { $set: { refreshTokens: [], rotatedTokens: [] } });
  clearAuthCookies(res);
  return res.status(401).json({ message: 'Refresh token reuse detected - all sessions revoked' });
});

// POST /auth/logout - removes THIS session's refresh token from the database.
// Always clears the cookies and answers 200, even if the token was already gone.
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.jwt;
  if (refreshToken) {
    const h = hashToken(refreshToken);
    await User.updateOne(
      { $or: [{ refreshTokens: h }, { 'rotatedTokens.next': h }] },
      { $pull: { refreshTokens: h, rotatedTokens: { next: h } } }
    );
  }
  clearAuthCookies(res);
  res.json({ message: 'Logged out' });
});

module.exports = { register, login, refresh, logout, googleAuth, googleCallback, exchangeGoogleCode, guestLogin, verifyOtp, resendOtp };