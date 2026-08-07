const User = require('../models/User');
const bcrypt = require('bcrypt');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// GET /users/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('name email defaultPriority isGuest');
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
});

// PATCH /users/me
const updateMe = asyncHandler(async (req, res) => {
  const { name, defaultPriority } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (defaultPriority !== undefined) updates.defaultPriority = defaultPriority;

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select('name email defaultPriority isGuest');

  res.json(user);
});

// POST /users/upgrade — converts a guest account into a real one by adding
// email+password, keeping the same _id so all their tasks/workspaces stay intact.
const upgradeGuest = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password required', 400);

  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);
  if (!user.isGuest) throw new AppError('This account is not a guest account', 400);

  const emailTaken = await User.findOne({ email });
  if (emailTaken) throw new AppError('Email already in use', 409);

  user.email = email;
  user.password = await bcrypt.hash(password, 10);
  user.isGuest = false;
  user.isVerified = true; // already an authenticated session, no need to re-verify via OTP
  await user.save();

  res.json({ message: 'Account upgraded successfully', name: user.name, email: user.email });
});

module.exports = { getMe, updateMe, upgradeGuest };
