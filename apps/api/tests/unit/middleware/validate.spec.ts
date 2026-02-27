import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams, validate, validateData } from '../../../src/middleware/validate.js';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
      url: '/test',
      method: 'POST',
      socket: { remoteAddress: '127.0.0.1' } as never,
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  // =======================================================================
  // validateBody
  // =======================================================================
  describe('validateBody', () => {
    const schema = z.object({ name: z.string().min(1) });

    it('should call next when body is valid', () => {
      mockReq.body = { name: 'hello' };
      validateBody(schema)(mockReq as Request, mockRes as Response, next);

      expect(next).toHaveBeenCalled();
      expect(mockReq.body).toEqual({ name: 'hello' });
    });

    it('should return 400 when body is invalid', () => {
      mockReq.body = { name: '' };
      validateBody(schema)(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation Error' }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', () => {
      const throwingSchema = {
        safeParse: () => { throw new Error('boom'); },
      } as unknown as z.ZodSchema;

      validateBody(throwingSchema)(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Internal Server Error' }),
      );
    });
  });

  // =======================================================================
  // validateQuery
  // =======================================================================
  describe('validateQuery', () => {
    const schema = z.object({ page: z.string() });

    it('should call next when query is valid', () => {
      mockReq.query = { page: '1' };
      validateQuery(schema)(mockReq as Request, mockRes as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 400 when query is invalid', () => {
      mockReq.query = {};
      validateQuery(schema)(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', () => {
      const throwingSchema = {
        safeParse: () => { throw new Error('boom'); },
      } as unknown as z.ZodSchema;

      validateQuery(throwingSchema)(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // =======================================================================
  // validateParams
  // =======================================================================
  describe('validateParams', () => {
    const schema = z.object({ id: z.string().uuid() });

    it('should call next when params are valid', () => {
      mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      validateParams(schema)(mockReq as Request, mockRes as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 400 when params are invalid', () => {
      mockReq.params = { id: 'not-a-uuid' };
      validateParams(schema)(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on unexpected error', () => {
      const throwingSchema = {
        safeParse: () => { throw new Error('boom'); },
      } as unknown as z.ZodSchema;

      validateParams(throwingSchema)(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // =======================================================================
  // validate (combined)
  // =======================================================================
  describe('validate (combined)', () => {
    it('should call next when all schemas pass', () => {
      const bodySchema = z.object({ name: z.string() });
      const querySchema = z.object({ page: z.string() });
      const paramsSchema = z.object({ id: z.string() });

      mockReq.body = { name: 'test' };
      mockReq.query = { page: '1' };
      mockReq.params = { id: 'abc' };

      validate({ body: bodySchema, query: querySchema, params: paramsSchema })(
        mockReq as Request,
        mockRes as Response,
        next,
      );

      expect(next).toHaveBeenCalled();
    });

    it('should collect errors from multiple schemas', () => {
      const bodySchema = z.object({ name: z.string().min(1) });
      const querySchema = z.object({ page: z.string() });

      mockReq.body = { name: '' };
      mockReq.query = {};

      validate({ body: bodySchema, query: querySchema })(
        mockReq as Request,
        mockRes as Response,
        next,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      const jsonCall = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      // Should have errors from both body and query
      expect(jsonCall.details.length).toBeGreaterThanOrEqual(2);
    });

    it('should pass with only body schema', () => {
      const bodySchema = z.object({ name: z.string() });
      mockReq.body = { name: 'test' };

      validate({ body: bodySchema })(mockReq as Request, mockRes as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should pass with only params schema', () => {
      const paramsSchema = z.object({ id: z.string() });
      mockReq.params = { id: '123' };

      validate({ params: paramsSchema })(mockReq as Request, mockRes as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 when params fail in combined validator', () => {
      const paramsSchema = z.object({ id: z.string().uuid() });
      mockReq.params = { id: 'bad' };

      validate({ params: paramsSchema })(mockReq as Request, mockRes as Response, next);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on unexpected error', () => {
      const throwingSchema = {
        safeParse: () => { throw new Error('boom'); },
      } as unknown as z.ZodSchema;

      validate({ body: throwingSchema })(mockReq as Request, mockRes as Response, next);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // =======================================================================
  // validateData (non-middleware utility)
  // =======================================================================
  describe('validateData', () => {
    const schema = z.object({ email: z.string().email() });

    it('should return success for valid data', () => {
      const result = validateData(schema, { email: 'test@example.com' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ email: 'test@example.com' });
    });

    it('should return errors for invalid data', () => {
      const result = validateData(schema, { email: 'not-email' });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0].field).toBe('email');
    });

    it('should handle unexpected errors gracefully', () => {
      const throwingSchema = {
        safeParse: () => { throw new Error('unexpected'); },
      } as unknown as z.ZodSchema;

      const result = validateData(throwingSchema, {});
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].code).toBe('custom');
      expect(result.errors?.[0].message).toBe('unexpected');
    });

    it('should handle non-Error throws gracefully', () => {
      const throwingSchema = {
        safeParse: () => { throw 'string-error'; },
      } as unknown as z.ZodSchema;

      const result = validateData(throwingSchema, {});
      expect(result.success).toBe(false);
      expect(result.errors?.[0].message).toBe('Unknown validation error');
    });
  });
});
