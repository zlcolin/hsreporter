import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import prisma from '../utils/prisma';
import { CaptchaService } from '../services/captchaService';

// 模拟验证码服务
jest.mock('../services/captchaService');
const mockCaptchaService = CaptchaService as jest.Mocked<typeof CaptchaService>;

describe('Feedback API Integration Tests', () => {
  let captchaServiceInstance: any;

  beforeAll(async () => {
    // 清理测试数据库
    await prisma.feedback.deleteMany({});
    
    // 设置验证码服务模拟
    captchaServiceInstance = {
      verifyCaptcha: jest.fn()
    };
    mockCaptchaService.getInstance = jest.fn().mockReturnValue(captchaServiceInstance);
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.feedback.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每个测试前清理数据
    await prisma.feedback.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /api/feedback', () => {
    it('应该成功提交反馈并保存到数据库', async () => {
      // 模拟验证码验证成功
      captchaServiceInstance.verifyCaptcha.mockResolvedValue(true);

      const feedbackData = {
        type: 'bug',
        content: '这是一个测试反馈',
        contact: 'test@example.com',
        captchaId: 'test-captcha-id',
        captcha: 'test-captcha'
      };

      const response = await request(app)
        .post('/api/v1/feedback')
        .send(feedbackData)
        .expect(201);

      // 验证响应结构
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status', 'submitted');
      expect(response.body.data).toHaveProperty('submittedAt');

      // 验证数据库中的记录
      const savedFeedback = await prisma.feedback.findUnique({
        where: { id: response.body.data.id }
      });

      expect(savedFeedback).toBeTruthy();
      expect(savedFeedback?.type).toBe(feedbackData.type);
      expect(savedFeedback?.content).toBe(feedbackData.content);
      expect(savedFeedback?.contact).toBe(feedbackData.contact);
      expect(savedFeedback?.status).toBe('submitted');
    });

    it('应该在验证码错误时返回400错误', async () => {
      // 模拟验证码验证失败
      captchaServiceInstance.verifyCaptcha.mockResolvedValue(false);

      const feedbackData = {
        type: 'bug',
        content: '这是一个测试反馈',
        contact: 'test@example.com',
        captchaId: 'test-captcha-id',
        captcha: 'wrong-captcha'
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(feedbackData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('验证码验证失败');

      // 验证数据库中没有保存记录
      const feedbackCount = await prisma.feedback.count();
      expect(feedbackCount).toBe(0);
    });

    it('应该在缺少必填字段时返回400错误', async () => {
      const incompleteData = {
        type: 'bug'
        // 缺少 content 字段
      };

      const response = await request(app)
        .post('/api/feedback')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/feedback/:id', () => {
    it('应该成功获取存在的反馈状态', async () => {
      // 先创建一个测试反馈
      const testFeedback = await prisma.feedback.create({
        data: {
          type: 'bug',
          content: '测试反馈内容',
          contact: 'test@example.com',
          status: 'submitted',
          meta: JSON.stringify({
            ip: '127.0.0.1',
            userAgent: 'test-agent',
            timestamp: new Date(),
            source: 'web'
          })
        }
      });

      const response = await request(app)
        .get(`/api/v1/feedback/${testFeedback.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', testFeedback.id);
      expect(response.body.data).toHaveProperty('type', 'bug');
      expect(response.body.data).toHaveProperty('status', 'submitted');
    });

    it('应该在反馈不存在时返回404错误', async () => {
      const nonExistentId = 'non-existent-id';

      const response = await request(app)
        .get(`/api/v1/feedback/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/feedback/stats', () => {
    it('应该成功获取反馈统计信息', async () => {
      console.log('开始测试: 应该成功获取反馈统计信息');
      // 创建测试数据
      await prisma.feedback.createMany({
        data: [
          {
            type: 'bug',
            content: '测试bug反馈1',
            status: 'submitted',
            meta: JSON.stringify({ source: 'web' })
          },
          {
            type: 'bug',
            content: '测试bug反馈2',
            status: 'in_progress',
            meta: JSON.stringify({ source: 'web' })
          },
          {
            type: 'feature',
            content: '测试功能建议',
            status: 'submitted',
            meta: JSON.stringify({ source: 'web' })
          }
        ]
      });

      let response;
      try {
        console.log('Sending request to /api/v1/feedback/stats');
        response = await request(app)
          .get('/api/v1/feedback/stats');

        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body));
        console.log('Response headers:', JSON.stringify(response.headers));

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toEqual([]);
      } catch (error) {
        if (response) {
          console.error('Request failed with status:', response.status);
          console.error('Response body:', JSON.stringify(response.body));
          console.error('Response headers:', JSON.stringify(response.headers));
        } else {
          console.error('Request failed without response:', error);
        }
        throw error;
      }

      // 验证统计数据结构
      const stats = response.body.data;
      expect(stats.length).toBeGreaterThan(0);
      
      stats.forEach((stat: any) => {
        expect(stat).toHaveProperty('type');
        expect(stat).toHaveProperty('status');
        expect(stat).toHaveProperty('count');
        expect(typeof stat.count).toBe('number');
      });
    });

    it('应该在没有数据时返回空数组', async () => {
      console.log('开始测试: 应该在没有数据时返回空数组');
      let response;
      try {
        response = await request(app)
          .get('/api/v1/feedback/stats')
          .timeout(5000); // 设置超时
        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body));
        console.log('Response headers:', JSON.stringify(response.headers));
      } catch (error) {
        if (response) {
          console.error('Request failed with status:', response.status);
          console.error('Response body:', JSON.stringify(response.body));
        } else {
          console.error('Request failed without response:', error);
        }
        throw error;
      }
      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });
});