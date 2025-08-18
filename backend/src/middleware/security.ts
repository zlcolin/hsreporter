import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiResponse } from '@/types/api';

// CORS configuration
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  optionsSuccessStatus: 200
};

// Helmet security configuration
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
};

// Rate limiting configuration
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: (req: Request, res: Response) => {
      const requestId = req.headers['x-request-id'] as string || 'unknown';
      const response: ApiResponse = {
        success: false,
        message,
        error: { code: 'RATE_LIMIT_EXCEEDED' },
        timestamp: new Date().toISOString(),
        requestId
      };
      return response;
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/api/v1/health';
    }
  });
};

// General API rate limiter
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  '请求过于频繁，请稍后再试'
);

// Strict rate limiter for sensitive endpoints
export const strictLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // limit each IP to 10 requests per windowMs
  '该操作请求过于频繁，请稍后再试'
);

// Moderate rate limiter for file uploads
export const moderateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  30, // limit each IP to 30 requests per windowMs
  '文件上传请求过于频繁，请稍后再试'
);

export { helmet, cors };