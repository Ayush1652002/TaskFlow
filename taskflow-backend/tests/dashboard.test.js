const request = require('supertest');
const app = require('../app');
const { createVerifiedUser } = require('./helpers');

const auth = (user) => ({ Authorization: `Bearer ${user.accessToken}` });

describe('Dashboard + board behaviour (Module 1)', () => {
  let owner, workspaceId;

  beforeEach(async () => {
    owner = await createVerifiedUser({ email: 'owner@test.com' });
    const ws = await request(app).post('/workspaces').set(auth(owner)).send({ name: 'WS' });
    workspaceId = ws.body._id;
  });

  const addTask = (title, priority) =>
    request(app).post(`/tasks/${workspaceId}`).set(auth(owner)).send({ title, priority });

  it('sorts by priority by meaning: ascending = High, Medium, Low (not High, Low, Medium)', async () => {
    await addTask('a', 'Low');
    await addTask('b', 'High');
    await addTask('c', 'Medium');
    await addTask('d', 'High');

    const asc = await request(app).get(`/tasks/${workspaceId}?sortBy=priority&order=asc`).set(auth(owner));
    expect(asc.status).toBe(200);
    expect(asc.body.tasks.map((t) => t.priority)).toEqual(['High', 'High', 'Medium', 'Low']);

    const desc = await request(app).get(`/tasks/${workspaceId}?sortBy=priority&order=desc`).set(auth(owner));
    expect(desc.body.tasks.map((t) => t.priority)).toEqual(['Low', 'Medium', 'High', 'High']);
  });

  it('priority sort keeps working across pages', async () => {
    await addTask('a', 'Low');
    await addTask('b', 'High');
    await addTask('c', 'Medium');
    await addTask('d', 'High');

    const page2 = await request(app).get(`/tasks/${workspaceId}?sortBy=priority&order=asc&limit=2&page=2`).set(auth(owner));
    expect(page2.body.page).toBe(2);
    expect(page2.body.tasks.map((t) => t.priority)).toEqual(['Medium', 'Low']);
  });

  it('board view: limit=100 returns every task on one page, the list default is 10 per page', async () => {
    for (let i = 1; i <= 12; i++) await addTask(`Task ${i}`);

    const list = await request(app).get(`/tasks/${workspaceId}`).set(auth(owner));
    expect(list.body.tasks).toHaveLength(10);
    expect(list.body.totalPages).toBe(2);

    const board = await request(app).get(`/tasks/${workspaceId}?limit=100`).set(auth(owner));
    expect(board.body.tasks).toHaveLength(12);
    expect(board.body.totalPages).toBe(1);

    const tooMany = await request(app).get(`/tasks/${workspaceId}?limit=100000`).set(auth(owner));
    expect(tooMany.status).toBe(200);
    expect(tooMany.body.tasks).toHaveLength(12);
  });

  it('sorting by due date on page 2 still returns page 2', async () => {
    for (let i = 1; i <= 12; i++) await addTask(`Task ${i}`);

    const res = await request(app).get(`/tasks/${workspaceId}?sortBy=dueDate&order=asc&page=2`).set(auth(owner));
    expect(res.body.page).toBe(2);
    expect(res.body.tasks).toHaveLength(2);
  });
});
