import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from './logger.js';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  received?: unknown;
}

export interface ValidationResult {
  success: boolean;
  errors?: ValidationError[];
  data?: unknown;
}

/**
 * Formats Zod validation errors into a more user-friendly format
 */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.') || 'root',
    message: err.message,
    code: err.code,
    received: 'received' in err ? err.received : undefined,
  }));
}

/**
 * Validates request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the request body
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const validationErrors = formatZodErrors(result.error);
        
        // Log validation failure
        logger.warn({
          url: req.url,
          method: req.method,
          ip: req.socket?.remoteAddress,
          validationErrors,
          body: req.body,
        }, 'Request body validation failed');
        
        res.status(400).json({
          error: 'Validation Error',
          message: 'The request body contains invalid data',
          details: validationErrors,
        });
        return;
      }
      
      // Replace req.body with the validated and transformed data
      req.body = result.data;
      next();
      
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        url: req.url,
        method: req.method,
      }, 'Unexpected error during body validation');
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
}

/**
 * Validates request query parameters against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const validationErrors = formatZodErrors(result.error);
        
        logger.warn({
          url: req.url,
          method: req.method,
          ip: req.socket?.remoteAddress,
          validationErrors,
          query: req.query,
        }, 'Request query validation failed');
        
        res.status(400).json({
          error: 'Validation Error',
          message: 'The request query parameters contain invalid data',
          details: validationErrors,
        });
        return;
      }
      
      // Replace req.query with the validated and transformed data
      req.query = result.data as never;
      next();
      
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        url: req.url,
        method: req.method,
      }, 'Unexpected error during query validation');
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
}

/**
 * Validates request path parameters against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const validationErrors = formatZodErrors(result.error);
        
        logger.warn({
          url: req.url,
          method: req.method,
          ip: req.socket?.remoteAddress,
          validationErrors,
          params: req.params,
        }, 'Request params validation failed');
        
        res.status(400).json({
          error: 'Validation Error',
          message: 'The request path parameters contain invalid data',
          details: validationErrors,
        });
        return;
      }
      
      // Replace req.params with the validated and transformed data
      req.params = result.data as Record<string, string>;
      next();
      
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        url: req.url,
        method: req.method,
      }, 'Unexpected error during params validation');
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
}

/**
 * Comprehensive validation middleware that can validate body, query, and params
 */
export function validate<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown
>(options: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationErrors: ValidationError[] = [];
    
    try {
      // Validate body if schema provided
      if (options.body) {
        const bodyResult = options.body.safeParse(req.body);
        if (!bodyResult.success) {
          validationErrors.push(...formatZodErrors(bodyResult.error));
        } else {
          req.body = bodyResult.data;
        }
      }
      
      // Validate query if schema provided
      if (options.query) {
        const queryResult = options.query.safeParse(req.query);
        if (!queryResult.success) {
          validationErrors.push(...formatZodErrors(queryResult.error));
        } else {
          req.query = queryResult.data as never;
        }
      }
      
      // Validate params if schema provided
      if (options.params) {
        const paramsResult = options.params.safeParse(req.params);
        if (!paramsResult.success) {
          validationErrors.push(...formatZodErrors(paramsResult.error));
        } else {
          req.params = paramsResult.data as Record<string, string>;
        }
      }
      
      // If there are validation errors, return them
      if (validationErrors.length > 0) {
        logger.warn({
          url: req.url,
          method: req.method,
          ip: req.socket?.remoteAddress,
          validationErrors,
          body: req.body,
          query: req.query,
          params: req.params,
        }, 'Request validation failed');
        
        res.status(400).json({
          error: 'Validation Error',
          message: 'The request contains invalid data',
          details: validationErrors,
        });
        return;
      }
      
      next();
      
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        url: req.url,
        method: req.method,
      }, 'Unexpected error during validation');
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
}

/**
 * Utility function to validate data against a schema (non-middleware)
 */
export function validateData<T>(schema: ZodSchema<T>, data: unknown): ValidationResult {
  try {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      return {
        success: false,
        errors: formatZodErrors(result.error),
      };
    }
    
    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'root',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        code: 'custom',
      }],
    };
  }
}