import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams, validate, validateData } from '../../../src/middleware/validate.js';

describe('Validate Middleware', () => {
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
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe('validateBody', () => {
    const schema = z.object({ name: z.string(), age: z.number() });

    it('should call next when body is valid', () => {
      mockReq.body = { name: 'Alice', age: 30 };
      validateBody(schema)(mockReq as Request, mockRes as Response, next);
      expect(next).toHaveBeenCalled();
      expect(mockReq.body).toEqual({ name: 'Alice', age: 30 });
    });

    it('should return 400 when body is invalid', () => {
      mockReq.body = { name: 123 };
      validateBody(schema)(mockReq as Request, mockRes as Response, next);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation Error' }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', () => {
      const badSchema = { safeParse: () => { throw new Error('boom'); } } as unknown as z.ZodSchema;
      validateBody(badSchema)(mockReq as Request, mockRes as Response, next);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });
  });

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
      const badSchema = { safeParse: () => { throw new Error('boom'); } } as unknown as z.ZodSchema;
      validateQuery(badSchema)(mockReq as Request, mockRes as Response, next);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateParams', () => {
    const schema = z.object({ id: z.string().uuid() });

    it('should call next when params are valid', () => {
      mockReq.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      validateParams(schema)(mockReq as Request, mockRes as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 when params are invalid', () => {
      mockReq.params = { id: 'not-uuid' };
      validateParams(schema)(mockReq as Request, mockRes as Response, next);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', () => {
      const badSchema = { safeParse: () => { throw new Error('boom'); } } as unknown as z.ZodSchema;
      validateParams(badSchema)(mockReq as Request, mockRes as Response, next);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validate (combined)', () => {
    const bodySchema = z.object({ name: z.string() });
    const querySchema = z.object({ page: z.string() });
    const paramsSchema = z.object({ id: z.string() });

    it('should call next when all schemas pass', () => {
      mockReq.body = { name: 'Alice' };
      mockReq.query = { page: '1' };
      mockReq.params = { id: 'abc' };
      validate({ body: bodySchema, query: querySchema, params: paramsSchema })(
        mockReq as Request, mockRes as Response, next,
      );
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 when body fails', () => {
      mockReq.body = {};
      mockReq.query = { page: '1' };
      mockReq.params = { id: 'abc' };
      validate({ body: bodySchema, query: querySchema, params: paramsSchema })(
        mockReq as Request, mockRes as Response, next,
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when query fails', () => {
      mockReq.body = { name: 'Alice' };
      mockReq.query = {};
      validate({ body: bodySchema, query: querySchema })(
        mockReq as Request, mockRes as Response, next,
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when params fail', () => {
      mockReq.body = { name: 'Alice' };
      mockReq.params = {};
      validate({ body: bodySchema, params: paramsSchema })(
        mockReq as Request, mockRes as Response, next,
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should call next when no schemas provided', () => {
      validate({})(mockReq as Request, mockRes as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', () => {
      const badSchema = { safeParse: () => { throw new Error('boom'); } } as unknown as z.ZodSchema;
      validate({ body: badSchema })(mockReq as Request, mockRes as Response, next);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateData', () => {
    const schema = z.object({ value: z.number() });

    it('should return success for valid data', () => {
      const result = validateData(schema, { value: 42 });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ value: 42 });
    });

    it('should return errors for invalid data', () => {
      const result = validateData(schema, { value: 'not a number' });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should handle unexpected errors', () => {
      const badSchema = { safeParse: () => { throw new Error('boom'); } } as unknown as z.ZodSchema;
      const result = validateData(badSchema, {});
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('custom');
    });

    it('should handle non-Error throws', () => {
      const badSchema = { safeParse: () => { throw 'string error'; } } as unknown as z.ZodSchema;
      const result = validateData(badSchema, {});
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toBe('Unknown validation error');
    });
  });
});
