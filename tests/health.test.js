const { request, app } = require('./helpers');

describe('Health', () => {
  test('GET /health -> 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});
