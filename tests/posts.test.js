const { request, app, resetDatabase, createUser, login } = require('./helpers');

describe('Posts', () => {
  let token;
  let postId;

  beforeAll(async () => {
    await resetDatabase();
    await createUser({ email: 'user1@test.com', role: 'USER' });
    token = (await login('user1@test.com', '1234')).body.accessToken;
  });

  test('GET /posts -> 401 without token', async () => {
    const res = await request(app).get('/posts');
    expect(res.status).toBe(401);
  });

  test('POST /posts -> 201', async () => {
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: 't1', content: 'c1' });

    expect(res.status).toBe(201);
    postId = res.body.id;
    expect(postId).toBeTruthy();
  });

  test('GET /posts -> 200 (pagination)', async () => {
    const res = await request(app)
      .get('/posts?page=0&size=10&sort=createdAt,DESC')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.content)).toBe(true);
  });

  test('GET /posts/:id -> 200', async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(postId);
  });

  test('PATCH /posts/:id -> 200', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: 't2' });
    expect([200, 204]).toContain(res.status);
  });

  test('DELETE /posts/:id -> 204', async () => {
    const res = await request(app)
      .delete(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });

  test('GET /posts/:id -> 404 after delete', async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
