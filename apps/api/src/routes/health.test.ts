import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Health Endpoint', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      time: expect.any(String),
    });
  });

  it('should return valid timestamp', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    const timestamp = new Date(response.body.time);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
  });
});