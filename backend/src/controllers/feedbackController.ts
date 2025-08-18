import { Request, Response, NextFunction } from 'express';
import { FeedbackService } from '@/services/feedbackService';
import { UploadService } from '@/services/uploadService';
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
      const files = req.files as Express.Multer.File[] || [];
      
      const metadata = {
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent']
      };
      
      logger.info('Feedback submission started', {
        requestId,
        type: feedbackRequest.type,
        hasContact: !!feedbackRequest.contact,
        fileCount: files.length
      });

      // Enhanced file validation and processing
      const processedFiles = [];
      const filesToCleanup: string[] = [];

      try {
        // Validate and process each uploaded file
        for (const file of files) {
          const validation = await UploadService.validateFile(file);
          if (!validation.isValid) {
            throw new Error(validation.error || '文件验证失败');
          }

          const processed = await UploadService.processFile(file);
          processedFiles.push({
            ...file,
            path: processed.processedPath,
            size: processed.processedSize,
            originalSize: processed.originalSize,
            compressionRatio: processed.compressionRatio
          });

          // Track files for cleanup
          if (processed.processedPath !== processed.originalPath) {
            filesToCleanup.push(processed.originalPath);
          }

          logger.info('File processed for feedback', {
            requestId,
            originalName: file.originalname,
            originalSize: processed.originalSize,
            processedSize: processed.processedSize,
            compressionRatio: processed.compressionRatio
          });
        }

        const result = await this.feedbackService.submitFeedback(
          feedbackRequest,
          processedFiles as Express.Multer.File[],
          metadata
        );
        
        const response: ApiResponse<FeedbackResponse> = {
          success: true,
          data: result,
          message: '反馈提交成功',
          timestamp: new Date().toISOString(),
          requestId
        };
        
        res.status(201).json(response);

        // Cleanup original files if they were compressed
        if (filesToCleanup.length > 0) {
          setTimeout(() => {
            UploadService.cleanupFiles(filesToCleanup);
          }, 1000);
        }

      } catch (error) {
        // Cleanup all uploaded files on error
        const allFiles = files.map(f => f.path).concat(filesToCleanup);
        UploadService.cleanupFiles(allFiles);
        throw error;
      }
      
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
  
  getFeedbackStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestId = req.headers['x-request-id'] as string;
      
      const result = await this.feedbackService.getFeedbackStats();
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: '统计数据获取成功',
        timestamp: new Date().toISOString(),
        requestId
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}