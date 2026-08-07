const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

// Registers via the real endpoint, then reads the OTP directly from the
// database (since the email transport is mocked) to complete verification —
// this exercises the actual register -> verify -> login code path end to end.
const createVerifiedUser = async ({ name = 'Test User', email, password = 'password123' }) => {
  await request(app).post('/auth/register').send({ name, email, password });

  const user = await User.findOne({ email });
  const res = await request(app).post('/auth/verify-otp').send({ email, otp: user.otpCode });

  return { accessToken: res.body.accessToken, id: res.body.id };
};

module.exports = { createVerifiedUser };
