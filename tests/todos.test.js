const { request, app, resetDatabase, createUser, login } = require('./helpers');

describe('Todos', () => {
  let token;
  let todoId;

  beforeAll(async () => {
    await resetDatabase();
    await createUser({ email: 'user1@test.com', role: 'USER' });
    token = (await login('user1@test.com', '1234')).body.accessToken;
  });

  test('POST /todos -> 201', async () => {
    const res = await request(app)
      .post('/todos')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ title: 'todo1' });

    expect(res.status).toBe(201);
    todoId = res.body.id;
  });

  test('GET /todos -> 200', async () => {
    const res = await request(app)
      .get('/todos?page=0&size=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('GET /todos/:id -> 200', async () => {
    const res = await request(app)
      .get(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('PATCH /todos/:id -> 200', async () => {
    const res = await request(app)
      .patch(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({ completed: true });
    expect([200, 204]).toContain(res.status);
  });

  test('DELETE /todos/:id -> 204', async () => {
    const res = await request(app)
      .delete(`/todos/${todoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });
});
