const request = require('supertest');
const app = require('../app');
const { createVerifiedUser } = require('./helpers');

describe('Workspaces + Task RBAC', () => {
  let owner, member, outsider, workspaceId;

  beforeEach(async () => {
    owner = await createVerifiedUser({ email: 'owner@test.com' });
    member = await createVerifiedUser({ email: 'member@test.com' });
    outsider = await createVerifiedUser({ email: 'outsider@test.com' });

    const wsRes = await request(app)
      .post('/workspaces')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Test Workspace' });
    workspaceId = wsRes.body._id;

    // Add `member` as a plain member (not admin/manager)
    await request(app)
      .post(`/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ email: 'member@test.com', role: 'member' });
  });

  it('creates a workspace with the creator as owner', async () => {
    const res = await request(app)
      .get('/workspaces')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.body[0].members.some(m => m.role === 'owner')).toBe(true);
  });

  it('blocks a non-member from accessing workspace tasks', async () => {
    const res = await request(app)
      .get(`/tasks/${workspaceId}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('lets a member create a task', async () => {
    const res = await request(app)
      .post(`/tasks/${workspaceId}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ title: 'My task' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('My task');
  });

  it('lets a plain member edit their OWN task', async () => {
    const createRes = await request(app)
      .post(`/tasks/${workspaceId}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ title: 'Own task' });

    const editRes = await request(app)
      .put(`/tasks/${workspaceId}/${createRes.body._id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ title: 'Edited' });

    expect(editRes.status).toBe(200);
    expect(editRes.body.title).toBe('Edited');
  });

  it('blocks a plain member from editing a task they neither created nor are assigned to', async () => {
    // Owner creates a task, doesn't assign it to `member`
    const createRes = await request(app)
      .post(`/tasks/${workspaceId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: "Owner's task" });

    const editRes = await request(app)
      .put(`/tasks/${workspaceId}/${createRes.body._id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ title: 'Trying to edit' });

    expect(editRes.status).toBe(403);
  });

  it('lets an owner edit ANY task in the workspace, regardless of who created it', async () => {
    const createRes = await request(app)
      .post(`/tasks/${workspaceId}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ title: "Member's task" });

    const editRes = await request(app)
      .put(`/tasks/${workspaceId}/${createRes.body._id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Owner override' });

    expect(editRes.status).toBe(200);
  });

  it('lets a member edit a task assigned to them even if someone else created it', async () => {
    const createRes = await request(app)
      .post(`/tasks/${workspaceId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Assigned task', assignee: member.id });

    const editRes = await request(app)
      .put(`/tasks/${workspaceId}/${createRes.body._id}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ status: 'done' });

    expect(editRes.status).toBe(200);
    expect(editRes.body.status).toBe('done');
  });

  it('rejects assigning a task to someone outside the workspace', async () => {
    const res = await request(app)
      .post(`/tasks/${workspaceId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ title: 'Bad assignment', assignee: outsider.id });

    expect(res.status).toBe(400);
  });
});
