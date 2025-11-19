import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

// Create base logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Simple HTTP logger middleware with request ID
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const reqId = uuidv4();
  
  // Add request ID to request object
  (req as Request & { id: string }).id = reqId;
  
  // Log incoming request
  logger.info({
    req: {
      id: reqId,
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
      remoteAddress: req.socket?.remoteAddress,
      remotePort: req.socket?.remotePort,
    },
  }, 'incoming request');
  
  // Log response when finished
  res.on('finish', () => {
    const latency_ms = Date.now() - startTime;
    
    const logLevel = res.statusCode >= 500 ? 'error' : 
                    res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]({
      req: { id: reqId, method: req.method, url: req.url },
      res: {
        statusCode: res.statusCode,
        headers: {
          'content-type': res.getHeader('content-type'),
          'content-length': res.getHeader('content-length'),
        },
      },
      latency_ms,
    }, `${req.method} ${res.statusCode >= 400 ? 'errored' : 'completed'}`);
  });
  
  next();
};