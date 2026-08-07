const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { createVerifiedUser } = require('./helpers');

describe('Auth: register + OTP + login', () => {
  it('registers a new user as unverified', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Ayush', email: 'ayush@test.com', password: 'password123',
    });

    expect(res.status).toBe(201);
    const user = await User.findOne({ email: 'ayush@test.com' });
    expect(user.isVerified).toBe(false);
    expect(user.otpCode).toHaveLength(6);
  });

  it('rejects registering the same email twice', async () => {
    await request(app).post('/auth/register').send({
      name: 'A', email: 'dupe@test.com', password: 'password123',
    });
    const res = await request(app).post('/auth/register').send({
      name: 'B', email: 'dupe@test.com', password: 'password123',
    });

    expect(res.status).toBe(409);
  });

  it('blocks login before the account is verified', async () => {
    await request(app).post('/auth/register').send({
      name: 'Unverified', email: 'unverified@test.com', password: 'password123',
    });

    const res = await request(app).post('/auth/login').send({
      email: 'unverified@test.com', password: 'password123',
    });

    expect(res.status).toBe(403);
  });

  it('rejects an incorrect OTP', async () => {
    await request(app).post('/auth/register').send({
      name: 'Wrong OTP', email: 'wrongotp@test.com', password: 'password123',
    });

    const res = await request(app).post('/auth/verify-otp').send({
      email: 'wrongotp@test.com', otp: '000000',
    });

    expect(res.status).toBe(400);
  });

  it('verifies with the correct OTP and logs in afterward', async () => {
    const { accessToken } = await createVerifiedUser({ email: 'verified@test.com' });
    expect(accessToken).toBeDefined();

    const loginRes = await request(app).post('/auth/login').send({
      email: 'verified@test.com', password: 'password123',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();
  });

  it('rejects login with the wrong password', async () => {
    await createVerifiedUser({ email: 'pwtest@test.com' });

    const res = await request(app).post('/auth/login').send({
      email: 'pwtest@test.com', password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
  });
});
