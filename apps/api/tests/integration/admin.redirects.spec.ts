import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app.js';

const prisma = new PrismaClient();

describe('Admin Redirects Integration', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
  let adminToken: string;

  beforeAll(async () => {
    adminToken = jwt.sign(
      { 
        userId: 'test-admin-id', 
        email: 'admin@example.com', 
        roles: ['admin'] 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.redirect.deleteMany();
  });

  describe('Redirects CRUD', () => {
    const newRedirect = {
      sourceSlug: 'old-page',
      destinationUrl: '/new-page',
      active: true
    };

    it('should create, read, update, and delete a redirect', async () => {
      // Create
      const createRes = await request(app)
        .post('/admin/redirects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRedirect);
      
      expect(createRes.status).toBe(201);
      expect(createRes.body.sourceSlug).toBe(newRedirect.sourceSlug);
      const redirectId = createRes.body.id;

      // List
      const listRes = await request(app)
        .get('/admin/redirects')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(listRes.status).toBe(200);
      expect(listRes.body.some((i: any) => i.id === redirectId)).toBe(true);

      // Update
      const updateRes = await request(app)
        .put(`/admin/redirects/${redirectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ destinationUrl: '/newer-page' });
      
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.destinationUrl).toBe('/newer-page');

      // Delete
      const deleteRes = await request(app)
        .delete(`/admin/redirects/${redirectId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteRes.status).toBe(204);
    });

    it('should prevent loops', async () => {
      const loopRedirect = {
        sourceSlug: 'loop',
        destinationUrl: '/loop',
        active: true
      };

      const res = await request(app)
        .post('/admin/redirects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(loopRedirect);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Redirect loop detected');
    });

    it('should prevent duplicate source slugs', async () => {
      await request(app)
        .post('/admin/redirects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRedirect);

      const res = await request(app)
        .post('/admin/redirects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRedirect);
      
      expect(res.status).toBe(409);
    });
  });
});
