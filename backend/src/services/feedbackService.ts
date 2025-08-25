import prisma from '@/utils/prisma';
import { FeedbackRequest, FeedbackResponse } from '@/types/api';
import { CaptchaService } from './captchaService';
import logger from '@/utils/logger';
import { AppError } from '@/middleware/errorHandler';
import { CreateFeedbackInput, FeedbackWithMetadata } from '@/types/feedback.prisma';

export class FeedbackService {
  private static instance: FeedbackService;
  private captchaService: CaptchaService;

  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  private constructor() {
    this.captchaService = CaptchaService.getInstance();
  }

  async submitFeedback(
    feedbackRequest: FeedbackRequest,
    metadata: { ip: string; userAgent?: string }
  ): Promise<FeedbackResponse> {
    // 验证码校验
    const isCaptchaValid = await this.captchaService.verifyCaptcha(
      feedbackRequest.captchaId,
      feedbackRequest.captcha
    );

    if (!isCaptchaValid) {
      throw new AppError('验证码验证失败，请重新输入', 400, 'CAPTCHA_INVALID');
    }

    // 准备数据
    // 处理联系信息，将对象转换为字符串
    let contactString: string | null | undefined = undefined;
    if (feedbackRequest.contact) {
      const contactParts = [];
      if (feedbackRequest.contact.email) contactParts.push(`email: ${feedbackRequest.contact.email}`);
      if (feedbackRequest.contact.phone) contactParts.push(`phone: ${feedbackRequest.contact.phone}`);
      if (feedbackRequest.contact.hsId) contactParts.push(`hsId: ${feedbackRequest.contact.hsId}`);
      contactString = contactParts.join(', ');
    }

    const feedbackInput: CreateFeedbackInput = {
      type: feedbackRequest.type,
      content: feedbackRequest.description,
      contact: contactString,
      metadata: {
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        timestamp: new Date(),
        source: 'web',
      },
    };

    // 使用 Prisma 创建反馈记录
    const feedback = await prisma.feedback.create({
      data: {
        type: feedbackInput.type,
        content: feedbackInput.content,
        contact: feedbackInput.contact,
        status: 'submitted',
        meta: JSON.stringify(feedbackInput.metadata), // 序列化为 JSON 字符串
      },
    });

    logger.info('Feedback record created in database', { feedbackId: feedback.id });

    return {
      id: feedback.id,
      status: 'submitted' as const,
      submittedAt: feedback.createdAt.toISOString(),
    };
  }

  async getFeedbackStatus(feedbackId: string): Promise<FeedbackWithMetadata | null> {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return null;
    }

    return {
      ...feedback,
      metadata: feedback.meta ? JSON.parse(feedback.meta) : null,
    };
  }

  async getFeedbackStats(): Promise<any> {
      // 检查是否有任何异常
      try {
        const mockData = [
          { type: 'bug', status: 'pending', count: 5 },
          { type: 'feature', status: 'approved', count: 2 }
        ];
        console.log('feedbackService.getFeedbackStats() returning:', mockData);
        return mockData;
      } catch (error) {
        console.error('Error in feedbackService.getFeedbackStats():', error);
        throw error;
      }
    }
}