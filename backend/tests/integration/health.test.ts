import request from 'supertest';
import { app } from '../../src/app';

describe('GET /health', () => {
  it('returns 200 OK with service status, timestamp, and today date', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'miniledger-backend');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('today');
  });
});
