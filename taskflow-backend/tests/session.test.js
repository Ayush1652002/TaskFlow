const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { createVerifiedUser } = require('./helpers');

const ORIGIN = 'http://localhost:5173';
const cookieOf = (res, name) => {
  const c = (res.headers['set-cookie'] || []).find((x) => x.startsWith(`${name}=`));
  return c ? c.split(';')[0] : null; // "jwt=xxxx"
};
const login = () => request(app).post('/auth/login').send({ email: 's@test.com', password: 'password123' });
const refresh = (jwtCookie, headers = { Origin: ORIGIN }) =>
  request(app).get('/auth/refresh').set({ Cookie: jwtCookie, ...headers });

describe('Session retention', () => {
  beforeEach(async () => { await createVerifiedUser({ email: 's@test.com' }); });

  it('refresh works from the allowed Origin even without a csrf header (no more 403)', async () => {
    const l = await login();
    const res = await refresh(cookieOf(l, 'jwt'));
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(cookieOf(res, 'jwt')).not.toBe(cookieOf(l, 'jwt')); // rotated
  });

  it('refresh from an unknown Origin with no csrf header is still blocked', async () => {
    const l = await login();
    const res = await refresh(cookieOf(l, 'jwt'), { Origin: 'https://evil.example' });
    expect(res.status).toBe(403);
    const none = await refresh(cookieOf(l, 'jwt'), {});
    expect(none.status).toBe(403);
  });

  it('classic csrf header + cookie still works', async () => {
    const l = await login();
    const csrf = cookieOf(l, 'csrfToken');
    const res = await request(app).get('/auth/refresh')
      .set({ Cookie: `${cookieOf(l, 'jwt')}; ${csrf}`, 'x-csrf-token': csrf.split('=')[1] });
    expect(res.status).toBe(200);
  });

  it('two refreshes at the same time do not log the user out', async () => {
    const l = await login();
    const jwtCookie = cookieOf(l, 'jwt');
    const [a, b] = await Promise.all([refresh(jwtCookie), refresh(jwtCookie)]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);

    const winner = [a, b].find((r) => cookieOf(r, 'jwt'));
    const next = await refresh(cookieOf(winner, 'jwt'));
    expect(next.status).toBe(200); // session survived the race
  });

  it('an old token used after the grace period revokes all sessions', async () => {
    const l = await login();
    const jwtCookie = cookieOf(l, 'jwt');
    const first = await refresh(jwtCookie);
    expect(first.status).toBe(200);

    // pretend the rotation happened 5 minutes ago
    await User.updateOne({ email: 's@test.com' }, { $set: { 'rotatedTokens.$[].at': new Date(Date.now() - 5 * 60 * 1000) } });

    const replay = await refresh(jwtCookie);
    expect(replay.status).toBe(401);
    const user = await User.findOne({ email: 's@test.com' });
    expect(user.refreshTokens).toHaveLength(0);
  });

  it('refresh tokens are stored hashed, not raw', async () => {
    const l = await login();
    const raw = cookieOf(l, 'jwt').split('=')[1];
    const user = await User.findOne({ email: 's@test.com' });
    expect(user.refreshTokens).not.toContain(raw);
    expect(user.refreshTokens.every((t) => /^[0-9a-f]{64}$/.test(t))).toBe(true);
  });

  it('logout invalidates the session; logging in again creates a fresh one', async () => {
    const l = await login();
    const jwtCookie = cookieOf(l, 'jwt');

    const out = await request(app).post('/auth/logout').set({ Cookie: jwtCookie, Origin: ORIGIN });
    expect(out.status).toBe(200);

    const after = await refresh(jwtCookie);
    expect(after.status).toBe(401);

    const again = await login();
    expect(again.status).toBe(200);
    const fresh = await refresh(cookieOf(again, 'jwt'));
    expect(fresh.status).toBe(200);
  });

  it('refresh without any cookie is a clean 401', async () => {
    const res = await request(app).get('/auth/refresh').set({ Origin: ORIGIN });
    expect(res.status).toBe(401);
  });

  it('a Vercel preview URL of this project is allowed, other sites are not', async () => {
    const l = await login();
    const ok = await refresh(cookieOf(l, 'jwt'), { Origin: 'https://task-flow-abc123-ayushsahares-projects.vercel.app' });
    expect(ok.status).toBe(200);
    const bad = await refresh(cookieOf(l, 'jwt'), { Origin: 'https://task-flow-abc123-someone-else.vercel.app' });
    expect(bad.status).toBe(403);
  });

  it('google login remembers the preview origin it started from', async () => {
    const origin = 'https://task-flow-abc123-ayushsahares-projects.vercel.app';
    const res = await request(app).get('/auth/google').query({ origin });
    expect((res.headers['set-cookie'] || []).some((c) => c.startsWith('oauth_origin='))).toBe(true);
    const evil = await request(app).get('/auth/google').query({ origin: 'https://evil.example' });
    expect((evil.headers['set-cookie'] || []).some((c) => c.startsWith('oauth_origin='))).toBe(false);
  });
});
