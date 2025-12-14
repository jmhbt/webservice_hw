const { request, app, resetDatabase, createUser, login } = require('./helpers');

describe('Comments', () => {
  let token;
  let postId;
  let commentId;

  beforeAll(async () => {
    await resetDatabase();
    await createUser({ email: 'user1@test.com', role: 'USER' });
    token = (await login('user1@test.com', '1234')).body.accessToken;

    const postRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: 'post', content: 'content' });

    postId = postRes.body.id;
  });

  test('POST /posts/:id/comments -> 201', async () => {
    const res = await request(app)
      .post(`/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ content: 'comment1' });

    expect(res.status).toBe(201);
    commentId = res.body.id;
  });

  test('GET /posts/:id/comments -> 200', async () => {
    const res = await request(app)
      .get(`/posts/${postId}/comments?page=0&size=10`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('GET /comments/:id -> 200', async () => {
    const res = await request(app)
      .get(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('PATCH /comments/:id -> 200', async () => {
    const res = await request(app)
      .patch(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ content: 'updated' });
    expect([200, 204]).toContain(res.status);
  });

  test('DELETE /comments/:id -> 204', async () => {
    const res = await request(app)
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });
});
