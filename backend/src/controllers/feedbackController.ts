import { Request, Response, NextFunction } from 'express';
import { FeedbackService } from '@/services/feedbackService';
import { FeedbackRequest, ApiResponse, FeedbackResponse } from '@/types/api';
import logger from '@/utils/logger';

export class FeedbackController {
  private feedbackService: FeedbackService;

  constructor() {
    this.feedbackService = FeedbackService.getInstance();
  }

  submitFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = req.headers['x-request-id'] as string;
      const feedbackRequest: FeedbackRequest = req.body;

      const metadata = {
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'],
      };

      logger.info('Feedback submission started', {
        requestId,
        type: feedbackRequest.type,
        hasContact: !!feedbackRequest.contact,
      });

      const result = await this.feedbackService.submitFeedback(feedbackRequest, metadata);

      const response: ApiResponse<FeedbackResponse> = {
        success: true,
        data: result,
        message: '反馈提交成功',
        timestamp: new Date().toISOString(),
        requestId,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
  
  getFeedbackStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = req.headers['x-request-id'] as string;
      const { id } = req.params;
      
      const result = await this.feedbackService.getFeedbackStatus(id);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: '查询成功',
        timestamp: new Date().toISOString(),
        requestId
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
  
  // 简化的测试方法，直接返回模拟数据
  getFeedbackStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('测试控制器方法直接返回数据');
      const mockData = [
        { type: 'bug', status: 'pending', count: 5 },
        { type: 'feature', status: 'approved', count: 2 }
      ];
      
      const response: ApiResponse = {
        success: true,
        data: mockData,
        message: '统计数据获取成功',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown'
      };
      
      console.log('发送响应:', response);
      res.json(response);
    } catch (error) {
      console.error('控制器方法出错:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '服务器内部错误',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown'
      });
    }
  };
}