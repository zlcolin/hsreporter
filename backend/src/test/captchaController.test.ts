import request from 'supertest';
import express from 'express';
import { captchaRoutes } from '../routes/captchaRoutes';
import { errorHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock rate limiter to avoid rate limiting in tests
jest.mock('../middleware/rateLimiter', () => ({
  rateLimiter: {
    captchaGenerate: (req: any, res: any, next: any) => next(),
    captchaVerify: (req: any, res: any, next: any) => next(),
    generalApi: (req: any, res: any, next: any) => next(),
    upload: (req: any, res: any, next: any) => next()
  }
}));

describe('CaptchaController Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/captcha', captchaRoutes);
    app.use(errorHandler);
  });

  describe('GET /api/v1/captcha/generate', () => {
    it('should generate captcha successfully', async () => {
      const response = await request(app)
        .get('/api/v1/captcha/generate')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('imageUrl');
      expect(response.body.data).toHaveProperty('captchaId');
      expect(response.body.data).toHaveProperty('expiresIn');
      
      expect(response.body.data.imageUrl).toMatch(/^data:image\/svg\+xml;base64,/);
      expect(response.body.data.captchaId).toMatch(/^captcha_\d+_[a-z0-9]+$/);
      expect(response.body.data.expiresIn).toBe(5 * 60 * 1000);
    });

    it('should include proper response headers', async () => {
      const response = await request(app)
        .get('/api/v1/captcha/generate')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('POST /api/v1/captcha/verify', () => {
    let captchaId: string;

    beforeEach(async () => {
      // Generate a captcha first
      const generateResponse = await request(app)
        .get('/api/v1/captcha/generate')
        .expect(200);
      
      captchaId = generateResponse.body.data.captchaId;
    });

    it('should fail verification with missing parameters', async () => {
      const response = await request(app)
        .post('/api/v1/captcha/verify')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail verification with invalid captcha ID format', async () => {
      const response = await request(app)
        .post('/api/v1/captcha/verify')
        .send({
          captchaId: 'invalid_format',
          code: '1234'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail verification with invalid code format', async () => {
      const response = await request(app)
        .post('/api/v1/captcha/verify')
        .send({
          captchaId: captchaId,
          code: 'abcd'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail verification with wrong code', async () => {
      const response = await request(app)
        .post('/api/v1/captcha/verify')
        .send({
          captchaId: captchaId,
          code: '0000'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should fail verification with non-existent captcha ID', async () => {
      const response = await request(app)
        .post('/api/v1/captcha/verify')
        .send({
          captchaId: 'captcha_999999999_nonexistent',
          code: '1234'
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('CAPTCHA_NOT_FOUND');
    });

    it('should handle multiple failed attempts', async () => {
      // Make multiple failed attempts
      await request(app)
        .post('/api/v1/captcha/verify')
        .send({ captchaId, code: '0000' });
      
      await request(app)
        .post('/api/v1/captcha/verify')
        .send({ captchaId, code: '0001' });
      
      const response = await request(app)
        .post('/api/v1/captcha/verify')
        .send({ captchaId, code: '0002' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOO_MANY_FAILED_ATTEMPTS');
    });
  });

  describe('POST /api/v1/captcha/refresh', () => {
    it('should refresh captcha successfully', async () => {
      const response = await request(app)
        .post('/api/v1/captcha/refresh')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('imageUrl');
      expect(response.body.data).toHaveProperty('captchaId');
      expect(response.body.data).toHaveProperty('expiresIn');
    });

    it('should refresh captcha with old captcha ID', async () => {
      // Generate initial captcha
      const generateResponse = await request(app)
        .get('/api/v1/captcha/generate')
        .expect(200);
      
      const oldCaptchaId = generateResponse.body.data.captchaId;

      // Refresh with old ID
      const refreshResponse = await request(app)
        .post('/api/v1/captcha/refresh')
        .send({ captchaId: oldCaptchaId })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.captchaId).not.toBe(oldCaptchaId);
    });
  });

  describe('GET /api/v1/captcha/stats', () => {
    it('should return stats in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/v1/captcha/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalActive');
      expect(response.body.data).toHaveProperty('totalGenerated');
      expect(response.body.data).toHaveProperty('totalVerified');
      expect(response.body.data).toHaveProperty('totalExpired');
      expect(response.body.data).toHaveProperty('totalFailed');

      process.env.NODE_ENV = originalEnv;
    });

    it('should return 404 in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await request(app)
        .get('/api/v1/captcha/stats')
        .expect(404);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/captcha/verify')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express should handle malformed JSON and return 400
      expect(response.status).toBe(400);
    });

    it('should handle large payloads gracefully', async () => {
      const largePayload = {
        captchaId: 'captcha_123456789_abcdefghi',
        code: '1234',
        extraData: 'x'.repeat(10000) // Large string
      };

      const response = await request(app)
        .post('/api/v1/captcha/verify')
        .send(largePayload);

      // Should either process or reject gracefully, not crash
      expect([200, 400, 413]).toContain(response.status);
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app)
        .post('/api/v1/captcha/verify')
        .send({
          captchaId: 'captcha_999999999_nonexistent',
          code: '1234'
        })
        .expect(400);

      // Should not expose internal details
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body.message).not.toContain('Error:');
      expect(response.body.message).not.toContain('at ');
    });

    it('should include request ID for tracking', async () => {
      const response = await request(app)
        .get('/api/v1/captcha/generate')
        .expect(200);

      expect(response.body).toHaveProperty('requestId');
      expect(typeof response.body.requestId).toBe('string');
    });
  });
});