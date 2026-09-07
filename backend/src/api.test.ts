import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.hoisted(() => {
  process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:1/test';
});

import { app } from './index';

describe('HTTP API', () => {
  it('returns the supported game types', async () => {
    const response = await request(app).get('/api/game-types');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(['catan-classic', 'catan-seafarers']);
  });

  it('returns trait definitions even when the database is unavailable', async () => {
    const response = await request(app).get('/api/traits');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toEqual(expect.objectContaining({
      name: expect.any(String),
      description: expect.any(String),
      conflicts: expect.any(Array),
    }));
  });

  it('reports backend health and database status', async () => {
    const response = await request(app).get('/api/health');

    expect([200, 503]).toContain(response.status);
    expect(response.body.backend).toBe(true);
    expect(typeof response.body.database).toBe('boolean');
  });

  it.each([
    ['GET', '/api/auth/me'],
    ['GET', '/api/agents'],
    ['GET', '/api/matches'],
    ['GET', '/api/matches/discover'],
  ])('%s %s rejects unauthenticated requests', async (method, path) => {
    const response = await request(app)[method.toLowerCase() as 'get'](path);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('rejects malformed registration without touching the database', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Missing credentials' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Email and password are required' });
  });

  it('rejects malformed login without touching the database', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing-password@example.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Email and password are required' });
  });
});
