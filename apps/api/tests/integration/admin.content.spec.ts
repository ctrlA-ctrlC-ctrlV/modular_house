import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app.js';

const prisma = new PrismaClient();

describe('Admin Content Integration', () => {
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
    // Clean up tables in reverse order of dependencies
    // Note: Page has relation to GalleryItem (heroImage), so delete Pages first
    await prisma.submission.deleteMany();
    await prisma.page.deleteMany();
    await prisma.galleryItem.deleteMany();
    await prisma.fAQ.deleteMany();
  });

  describe('Pages CRUD', () => {
    const newPage = {
      title: 'Test Page',
      slug: 'test-page',
      heroHeadline: 'Test Headline',
      sections: [{ type: 'text', content: 'Hello' }]
    };

    it('should create, read, update, and delete a page', async () => {
      // Create
      const createRes = await request(app)
        .post('/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newPage);
      
      expect(createRes.status).toBe(201);
      expect(createRes.body.title).toBe(newPage.title);
      expect(createRes.body.slug).toBe(newPage.slug);
      const pageId = createRes.body.id;

      // List
      const listRes = await request(app)
        .get('/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].id).toBe(pageId);

      // Get by ID
      const getRes = await request(app)
        .get(`/admin/pages/${pageId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(pageId);

      // Update
      const updateRes = await request(app)
        .put(`/admin/pages/${pageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Page' });
      
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.title).toBe('Updated Page');

      // Delete
      const deleteRes = await request(app)
        .delete(`/admin/pages/${pageId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteRes.status).toBe(204);

      // Verify Delete
      const getAfterDelete = await request(app)
        .get(`/admin/pages/${pageId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(getAfterDelete.status).toBe(404);
    });
  });

  describe('Gallery CRUD', () => {
    const newItem = {
      title: 'Garden Room 1',
      category: 'GARDEN_ROOM',
      imageUrl: 'https://example.com/uploads/test.jpg',
      altText: 'A nice garden room',
      publishStatus: 'DRAFT'
    };

    it('should create, read, update, and delete a gallery item', async () => {
      // Create
      const createRes = await request(app)
        .post('/admin/gallery')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newItem);
      
      expect(createRes.status).toBe(201);
      expect(createRes.body.title).toBe(newItem.title);
      const itemId = createRes.body.id;

      // List
      const listRes = await request(app)
        .get('/admin/gallery')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(listRes.status).toBe(200);
      expect(listRes.body.some((i: any) => i.id === itemId)).toBe(true);

      // Update
      const updateRes = await request(app)
        .put(`/admin/gallery/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Garden Room' });
      
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.title).toBe('Updated Garden Room');

      // Delete
      const deleteRes = await request(app)
        .delete(`/admin/gallery/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteRes.status).toBe(204);
    });
  });

  describe('FAQ CRUD', () => {
    const newFAQ = {
      question: 'What is this?',
      answer: 'It is a test.',
      displayOrder: 1
    };

    it('should create, read, update, and delete an FAQ', async () => {
      // Create
      const createRes = await request(app)
        .post('/admin/faqs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newFAQ);
      
      expect(createRes.status).toBe(201);
      expect(createRes.body.question).toBe(newFAQ.question);
      const faqId = createRes.body.id;

      // List
      const listRes = await request(app)
        .get('/admin/faqs')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(listRes.status).toBe(200);
      expect(listRes.body.some((i: any) => i.id === faqId)).toBe(true);

      // Update
      const updateRes = await request(app)
        .put(`/admin/faqs/${faqId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Updated Question' });
      
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.question).toBe('Updated Question');

      // Delete
      const deleteRes = await request(app)
        .delete(`/admin/faqs/${faqId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteRes.status).toBe(204);
    });
  });

  describe('CSV Export', () => {
    it('should export submissions as CSV', async () => {
      // Create a submission directly in DB
      await prisma.submission.create({
        data: {
          payload: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
            address: '123 Main St',
            eircode: 'D01 AB12',
            consent: true
          },
          sourcePageSlug: 'contact',
          consentFlag: true,
          consentText: 'I agree',
          ipHash: 'hash123'
        }
      });

      const res = await request(app)
        .get('/admin/submissions/export.csv')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('ID,Created At,Source Page,First Name,Last Name,Email,Phone,Address,Eircode,Product,Message,Consent,Consent Text,IP Hash,User Agent');
      expect(res.text).toContain('John,Doe');
      expect(res.text).toContain('john@example.com');
    });
  });
});
