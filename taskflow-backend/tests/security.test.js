const fs = require('fs');
const path = require('path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const OAuthSession = require('../models/OAuthSession');
const { UPLOAD_DIR } = require('../middleware/upload');
const { createVerifiedUser } = require('./helpers');
// changed
const auth = (user) => ({ Authorization: `Bearer ${user.accessToken}` });
const pdf = () => Buffer.from('%PDF-1.4 test file');

describe('Security + fixes (Line 1 and 2)', () => {
  let owner, member, other, outsider, workspaceId;
  const savedFiles = [];

  beforeEach(async () => {
    owner = await createVerifiedUser({ email: 'owner@test.com' });
    member = await createVerifiedUser({ email: 'member@test.com' });
    other = await createVerifiedUser({ email: 'other@test.com' });
    outsider = await createVerifiedUser({ email: 'outsider@test.com' });

    const ws = await request(app).post('/workspaces').set(auth(owner)).send({ name: 'WS' });
    workspaceId = ws.body._id;

    for (const email of ['member@test.com', 'other@test.com']) {
      await request(app).post(`/workspaces/${workspaceId}/members`).set(auth(owner)).send({ email, role: 'member' });
    }
  });

  afterAll(() => {
    savedFiles.forEach((f) => fs.rmSync(path.join(UPLOAD_DIR, f), { force: true }));
  });

  const createTask = async (user, title = 'Task') => {
    const res = await request(app).post(`/tasks/${workspaceId}`).set(auth(user)).send({ title });
    return res.body;
  };

  // ---- B7: clear all tasks ----
  it('B7: a plain member cannot clear all tasks, an owner can', async () => {
    await createTask(owner, 'Owner task');

    const memberRes = await request(app).delete(`/tasks/${workspaceId}`).set(auth(member));
    expect(memberRes.status).toBe(403);

    const list = await request(app).get(`/tasks/${workspaceId}`).set(auth(owner));
    expect(list.body.total).toBe(1); // still there

    const ownerRes = await request(app).delete(`/tasks/${workspaceId}`).set(auth(owner));
    expect(ownerRes.status).toBe(200);
  });

  // ---- B2: no public uploads ----
  it('B2: /uploads is no longer public', async () => {
    const res = await request(app).get('/uploads/anything.pdf');
    expect(res.status).toBe(404);
  });

  // ---- B3 / B4: upload rules ----
  it('B3: rejects .html uploads with a clear 400', async () => {
    const task = await createTask(owner);
    const res = await request(app)
      .post(`/tasks/${workspaceId}/${task._id}/attachments`)
      .set(auth(owner))
      .attach('file', Buffer.from('<script>1</script>'), { filename: 'evil.html', contentType: 'text/html' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not allowed/i);
  });

  // ---- B12: attachment permissions + authenticated download ----
  it('B12: only creator/assignee/manager+ can attach or remove files; any member can download', async () => {
    const task = await createTask(owner, 'Owner task');
    const base = `/tasks/${workspaceId}/${task._id}/attachments`;

    // a plain member who did NOT create the task cannot attach
    const denied = await request(app).post(base).set(auth(member))
      .attach('file', pdf(), { filename: 'a.pdf', contentType: 'application/pdf' });
    expect(denied.status).toBe(403);

    // the owner can
    const ok = await request(app).post(base).set(auth(owner))
      .attach('file', pdf(), { filename: 'report.pdf', contentType: 'application/pdf' });
    expect(ok.status).toBe(201);
    savedFiles.push(ok.body.filename);
    const attachmentId = ok.body._id;

    // any workspace member can download it, and it is forced to "download"
    const dl = await request(app).get(`${base}/${attachmentId}`).set(auth(other));
    expect(dl.status).toBe(200);
    expect(dl.headers['content-disposition']).toMatch(/attachment/i);
    expect(dl.headers['content-disposition']).toMatch(/report\.pdf/);

    // a person outside the workspace cannot download
    const outsiderDl = await request(app).get(`${base}/${attachmentId}`).set(auth(outsider));
    expect(outsiderDl.status).toBe(403);

    // a plain member who did not create the task cannot remove it
    const delDenied = await request(app).delete(`${base}/${attachmentId}`).set(auth(member));
    expect(delDenied.status).toBe(403);

    const delOk = await request(app).delete(`${base}/${attachmentId}`).set(auth(owner));
    expect(delOk.status).toBe(200);
  });

  // ---- B5: 401 vs 403 ----
  it('B5: missing or expired token gives 401 (not 403)', async () => {
    const none = await request(app).get(`/tasks/${workspaceId}`);
    expect(none.status).toBe(401);

    const expired = jwt.sign({ id: owner.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: -10 });
    const res = await request(app).get(`/tasks/${workspaceId}`).set({ Authorization: `Bearer ${expired}` });
    expect(res.status).toBe(401);
  });

  // ---- B15 / B21 / B22: stats, search escape, page clamp ----
  it('B15: list returns workspace-wide stats, not just the current page', async () => {
    const t1 = await createTask(owner, 'One');
    await createTask(owner, 'Two');
    await createTask(owner, 'Three');
    await request(app).put(`/tasks/${workspaceId}/${t1._id}`).set(auth(owner)).send({ completed: true });

    const res = await request(app).get(`/tasks/${workspaceId}?limit=2`).set(auth(owner));
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(2);
    expect(res.body.stats).toEqual({ total: 3, completed: 1, pending: 2 });
  });

  it('B21/B22: weird search text and page values do not crash the list', async () => {
    await createTask(owner, 'Fix (bug)');

    const paren = await request(app).get(`/tasks/${workspaceId}?search=${encodeURIComponent('(')}`).set(auth(owner));
    expect(paren.status).toBe(200);
    expect(paren.body.total).toBe(1);

    const twice = await request(app).get(`/tasks/${workspaceId}?search=a&search=b`).set(auth(owner));
    expect(twice.status).toBe(200);

    const negative = await request(app).get(`/tasks/${workspaceId}?page=-5&limit=100000`).set(auth(owner));
    expect(negative.status).toBe(200);
    expect(negative.body.page).toBe(1);
  });

  // ---- B14: analytics ----
  it('B14: analytics counts every task in the workspace', async () => {
    const t1 = await createTask(owner, 'A');
    await createTask(owner, 'B');
    await request(app).put(`/tasks/${workspaceId}/${t1._id}`).set(auth(owner)).send({ completed: true, priority: 'High' });

    const res = await request(app).get(`/analytics/${workspaceId}`).set(auth(member));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.completed).toBe(1);
    expect(res.body.pending).toBe(1);
    expect(res.body.priority.High).toBe(1);

    const blocked = await request(app).get(`/analytics/${workspaceId}`).set(auth(outsider));
    expect(blocked.status).toBe(403);
  });

  // ---- B10: reorder keeps other pages intact ----
  it('B10: reordering tasks on one page does not touch the order of other tasks', async () => {
    const t1 = await createTask(owner, '1');
    const t2 = await createTask(owner, '2');
    const t3 = await createTask(owner, '3');
    const t4 = await createTask(owner, '4');

    // pretend page 2 = [t3, t4] and the user swaps them
    const res = await request(app).patch(`/tasks/${workspaceId}/reorder`).set(auth(owner))
      .send({ orderedIds: [t4._id, t3._id] });
    expect(res.status).toBe(200);

    const list = await request(app).get(`/tasks/${workspaceId}?limit=10`).set(auth(owner));
    expect(list.body.tasks.map((t) => t._id)).toEqual([t1._id, t2._id, t4._id, t3._id]);

    const bad = await request(app).patch(`/tasks/${workspaceId}/reorder`).set(auth(owner))
      .send({ orderedIds: ['not-an-id'] });
    expect(bad.status).toBe(400);
  });

  // ---- B9: Google one-time code ----
  it('B9: the Google one-time code works exactly once', async () => {
    const user = await User.findOne({ email: 'member@test.com' });
    await OAuthSession.create({ code: 'abc123onetimecode', user: user._id });

    const first = await request(app).post('/auth/google/exchange').send({ code: 'abc123onetimecode' });
    expect(first.status).toBe(200);
    expect(first.body.accessToken).toBeDefined();
    expect(first.body.csrfToken).toBeDefined();

    const second = await request(app).post('/auth/google/exchange').send({ code: 'abc123onetimecode' });
    expect(second.status).toBe(400);

    const nothing = await request(app).post('/auth/google/exchange').send({});
    expect(nothing.status).toBe(400);
  });

  // ---- B44: csrf token also arrives in the JSON ----
  it('B44: login returns the same csrfToken that is stored in the cookie', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'owner@test.com', password: 'password123' });
    expect(res.status).toBe(200);

    const csrfCookie = res.headers['set-cookie'].find((c) => c.startsWith('csrfToken='));
    const cookieValue = csrfCookie.split(';')[0].replace('csrfToken=', '');
    expect(res.body.csrfToken).toBe(cookieValue);
  });

  // ---- B35: new workspace shows real names ----
  it('B35: a freshly created workspace comes back with member names', async () => {
    const res = await request(app).post('/workspaces').set(auth(member)).send({ name: 'Second' });
    expect(res.status).toBe(201);
    expect(res.body.members[0].user.name).toBeDefined();
  });
});
