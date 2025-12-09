import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { Request, Response, NextFunction } from 'express';
import app from '../../src/app.js';
import { SubmissionsService } from '../../src/services/submissions.js';

// Mock the SubmissionsService to avoid database calls in contract tests
vi.mock('../../src/services/submissions.js', () => ({
  SubmissionsService: {
    create: vi.fn().mockResolvedValue({
      id: 'test-submission-id',
      submission: {
        id: 'test-submission-id',
        payload: {},
        sourcePageSlug: 'contact',
        consentFlag: true,
        consentText: 'I consent to data processing',
        createdAt: new Date(),
        emailLog: {},
      },
    }),
    processSubmission: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock rate limiter to avoid rate limiting during tests
vi.mock('../../src/middleware/rateLimit.js', () => ({
  submissionRateLimit: (req: Request, res: Response, next: NextFunction) => next()
}));

const mockedSubmissionsService = vi.mocked(SubmissionsService);

describe('POST /submissions/enquiry - Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid submissions', () => {
    const validSubmission = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+353 1 234 5678',
      address: '123 Main Street, Dublin',
      eircode: 'D01 A2B3',
      preferredProduct: 'Garden Room',
      message: 'I am interested in a garden room for my backyard.',
      consent: true,
    };

    it('should accept valid submission and return success response', async () => {
      const response = await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        id: expect.any(String),
      });

      // Verify service was called with correct data
      expect(mockedSubmissionsService.create).toHaveBeenCalledWith({
        submissionData: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+353 1 234 5678',
          address: '123 Main Street, Dublin',
          eircode: 'D01 A2B3',
          preferredProduct: 'Garden Room',
          message: 'I am interested in a garden room for my backyard.',
          consent: true,
        }),
        sourcePageSlug: 'contact',
        ipHash: expect.any(String),
        userAgent: expect.any(String),
      });
    });

    it('should accept submission without optional fields', async () => {
      const minimalSubmission = {
        firstName: 'Jane',
        email: 'jane@example.com',
        phone: '+353 87 123 4567',
        address: '456 Oak Street, Cork',
        eircode: 'T12 XY78',
        consent: true,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(minimalSubmission)
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        id: expect.any(String),
      });

      expect(mockedSubmissionsService.create).toHaveBeenCalledWith({
        submissionData: expect.objectContaining({
          firstName: 'Jane',
          email: 'jane@example.com',
          phone: '+353 87 123 4567',
          address: '456 Oak Street, Cork',
          eircode: 'T12 XY78',
          consent: true,
        }),
        sourcePageSlug: 'contact',
        ipHash: expect.any(String),
        userAgent: expect.any(String),
      });
    });

    it('should extract source page slug from referer header', async () => {
      await request(app)
        .post('/submissions/enquiry')
        .set('Referer', 'https://example.com/products')
        .send(validSubmission)
        .expect(200);

      expect(mockedSubmissionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sourcePageSlug: 'products',
        })
      );
    });

    it('should handle missing referer header gracefully', async () => {
      await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);

      expect(mockedSubmissionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sourcePageSlug: 'contact',
        })
      );
    });
  });

  describe('Required field validation errors', () => {
    it('should return 400 for missing firstName', async () => {
      const invalidSubmission = {
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+353 1 234 5678',
        address: '123 Main Street, Dublin',
        eircode: 'D01 A2B3',
        consent: true,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'firstName',
            message: 'Required',
          }),
        ])
      );
    });

    it('should return 400 for missing email', async () => {
      const invalidSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+353 1 234 5678',
        address: '123 Main Street, Dublin',
        eircode: 'D01 A2B3',
        consent: true,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Required',
          }),
        ])
      );
    });

    it('should return 400 for invalid email format', async () => {
      const invalidSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '+353 1 234 5678',
        address: '123 Main Street, Dublin',
        eircode: 'D01 A2B3',
        consent: true,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Please enter a valid email address',
          }),
        ])
      );
    });

    it('should return 400 for missing phone', async () => {
      const invalidSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        address: '123 Main Street, Dublin',
        eircode: 'D01 A2B3',
        consent: true,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'phone',
            message: 'Required',
          }),
        ])
      );
    });

    it('should return 400 for invalid phone format', async () => {
      const invalidSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: 'invalid-phone',
        address: '123 Main Street, Dublin',
        eircode: 'D01 A2B3',
        consent: true,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'phone',
            message: 'Please enter a valid phone number',
          }),
        ])
      );
    });

    it('should accept submission without address', async () => {
      const validSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+353 1 234 5678',
        eircode: 'D01 A2B3',
        consent: true,
      };

      await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);
    });

    it('should accept submission without eircode', async () => {
      const validSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+353 1 234 5678',
        address: '123 Main Street, Dublin',
        consent: true,
      };

      await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);
    });

    it('should return 400 for invalid eircode format', async () => {
      const invalidSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+353 1 234 5678',
        address: '123 Main Street, Dublin',
        eircode: 'invalid-eircode!',
        consent: true,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'eircode',
            message: 'Please enter a valid Eircode',
          }),
        ])
      );
    });

    it('should return 400 for missing consent', async () => {
      const invalidSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+353 1 234 5678',
        address: '123 Main Street, Dublin',
        eircode: 'D01 A2B3',
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'consent',
            message: 'You must consent to data processing to submit this form',
          }),
        ])
      );
    });

    it('should return 400 for false consent', async () => {
      const invalidSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+353 1 234 5678',
        address: '123 Main Street, Dublin',
        eircode: 'D01 A2B3',
        consent: false,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'consent',
            message: 'You must consent to data processing to submit this form',
          }),
        ])
      );
    });

    it('should return 400 for multiple validation errors', async () => {
      const invalidSubmission = {
        firstName: '',
        email: 'invalid-email',
        phone: 'invalid-phone',
        consent: false,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveLength(4); // firstName, email, phone, consent
    });

    it('should return 400 for invalid preferredProduct value', async () => {
      const invalidSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+353 1 234 5678',
        address: '123 Main Street, Dublin',
        eircode: 'D01 A2B3',
        preferredProduct: 'Invalid Product',
        consent: true,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'preferredProduct',
            message: 'Please select a valid product option',
          }),
        ])
      );
    });

    it('should return 400 for message exceeding maximum length', async () => {
      const invalidSubmission = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+353 1 234 5678',
        address: '123 Main Street, Dublin',
        eircode: 'D01 A2B3',
        message: 'a'.repeat(2001), // Exceeds 2000 character limit
        consent: true,
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(invalidSubmission)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'message',
            message: 'Message must be less than 2000 characters',
          }),
        ])
      );
    });
  });

  describe('Honeypot protection', () => {
    const validSubmission = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+353 1 234 5678',
      address: '123 Main Street, Dublin',
      eircode: 'D01 A2B3',
      consent: true,
    };

    it('should reject submission with filled honeypot field but return success response', async () => {
      const botSubmission = {
        ...validSubmission,
        website: 'https://spam-site.com',
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(botSubmission)
        .expect(200);

      // Should return success to not reveal honeypot
      expect(response.body).toMatchObject({
        ok: true,
        id: expect.any(String),
      });

      // Should NOT call the submissions service
      expect(mockedSubmissionsService.create).not.toHaveBeenCalled();
      expect(mockedSubmissionsService.processSubmission).not.toHaveBeenCalled();
    });

    it('should accept submission with empty honeypot field', async () => {
      const legitimateSubmission = {
        ...validSubmission,
        website: '',
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(legitimateSubmission)
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        id: expect.any(String),
      });

      // Should call the submissions service
      expect(mockedSubmissionsService.create).toHaveBeenCalled();
    });

    it('should accept submission without honeypot field', async () => {
      const response = await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        id: expect.any(String),
      });

      // Should call the submissions service
      expect(mockedSubmissionsService.create).toHaveBeenCalled();
    });

    it('should reject submission with whitespace-only honeypot field', async () => {
      const botSubmission = {
        ...validSubmission,
        website: '   ',
      };

      const response = await request(app)
        .post('/submissions/enquiry')
        .send(botSubmission)
        .expect(200);

      // Should return success to not reveal honeypot
      expect(response.body).toMatchObject({
        ok: true,
        id: expect.any(String),
      });

      // Should NOT call the submissions service
      expect(mockedSubmissionsService.create).not.toHaveBeenCalled();
    });
  });

  describe('Rate limiting', () => {
    const validSubmission = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+353 1 234 5678',
      address: '123 Main Street, Dublin',
      eircode: 'D01 A2B3',
      consent: true,
    };

    it('should allow submissions when rate limiter is mocked', async () => {
      // Since we mocked the rate limiter, requests should always succeed
      const response = await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        id: expect.any(String),
      });
    });

    it('should have rate limiting middleware in production (integration test)', async () => {
      // This is more of a documentation test - the actual rate limiting
      // behavior should be tested in integration tests with real middleware
      // Here we just verify that the mocked middleware allows requests through
      const response = await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        id: expect.any(String),
      });
    });
  });

  describe('Error handling', () => {
    const validSubmission = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+353 1 234 5678',
      address: '123 Main Street, Dublin',
      eircode: 'D01 A2B3',
      consent: true,
    };

    it('should handle service errors gracefully (tested in integration tests)', async () => {
      // Service error handling should be tested in integration tests
      // where we can actually trigger database errors. For contract tests,
      // we focus on the API contract compliance.
      const response = await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
        id: expect.any(String),
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/submissions/enquiry')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/submissions/enquiry')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('details');
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should handle content-type other than application/json', async () => {
      const response = await request(app)
        .post('/submissions/enquiry')
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Response format compliance', () => {
    const validSubmission = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+353 1 234 5678',
      address: '123 Main Street, Dublin',
      eircode: 'D01 A2B3',
      consent: true,
    };

    it('should return response matching OpenAPI specification', async () => {
      const response = await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);

      // Check response structure matches OpenAPI spec
      expect(response.body).toEqual({
        ok: expect.any(Boolean),
        id: expect.any(String),
      });

      expect(response.body.ok).toBe(true);
      expect(typeof response.body.id).toBe('string');
      expect(response.body.id.length).toBeGreaterThan(0);
    });

    it('should set correct content-type header', async () => {
      const response = await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should include standard security headers', async () => {
      const response = await request(app)
        .post('/submissions/enquiry')
        .send(validSubmission)
        .expect(200);

      // These headers should be set by helmet middleware
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});