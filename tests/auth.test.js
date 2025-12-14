const { request, app, resetDatabase, createUser, login } = require('./helpers');

describe('Auth', () => {
  beforeAll(async () => {
    await resetDatabase();
    await createUser({ email: 'user1@test.com', role: 'USER' });
  });

  test('POST /auth/login -> 200 (valid)', async () => {
    const res = await login('user1@test.com', '1234');
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  test('POST /auth/login -> 400 (missing body)', async () => {
    const res = await request(app).post('/auth/login');
    expect(res.status).toBe(400);
  });

  test('POST /auth/login -> 401 (wrong password)', async () => {
    const res = await login('user1@test.com', 'wrong');
    expect(res.status).toBe(401);
  });

  test('POST /auth/refresh -> 200', async () => {
    const loginRes = await login('user1@test.com', '1234');
    const res = await request(app)
      .post('/auth/refresh')
      .set('Content-Type', 'application/json')
      .send({ refreshToken: loginRes.body.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  test('POST /auth/refresh -> 400 (missing refreshToken)', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(400);
  });
});
