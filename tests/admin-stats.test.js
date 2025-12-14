const { request, app, resetDatabase, createUser, login } = require('./helpers');

describe('Admin RBAC + Stats', () => {
  let adminToken;
  let userToken;
  let userId;

  beforeAll(async () => {
    await resetDatabase();

    const user = await createUser({ email: 'user1@test.com', role: 'USER' });
    userId = user.id;

    await createUser({ email: 'admin1@test.com', role: 'ADMIN' });

    adminToken = (await login('admin1@test.com', '1234')).body.accessToken;
    userToken = (await login('user1@test.com', '1234')).body.accessToken;
  });

  test('GET /users -> 403 for USER', async () => {
    const res = await request(app)
      .get('/users?page=0&size=10')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /users -> 200 for ADMIN', async () => {
    const res = await request(app)
      .get('/users?page=0&size=10')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('PATCH /users/:id/role -> 200 (ADMIN)', async () => {
    const res = await request(app)
      .patch(`/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send({ role: 'ADMIN' });
    expect([200, 204]).toContain(res.status);
  });

  test('PATCH /users/:id/deactivate -> 200 (ADMIN)', async () => {
    const res = await request(app)
      .patch(`/users/${userId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(res.status);
  });

  test('GET /stats/posts/daily -> 200 (ADMIN)', async () => {
    const res = await request(app)
      .get('/stats/posts/daily')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
