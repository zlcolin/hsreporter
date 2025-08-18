import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { FeedbackData, FileAttachment } from '@/types/feedback';
import { FeedbackRequest, FeedbackResponse } from '@/types/api';
import { RedmineService } from './redmineService';
import { CaptchaService } from './captchaService';
import logger from '@/utils/logger';
import { AppError } from '@/middleware/errorHandler';

export class FeedbackService {
  private static instance: FeedbackService;
  private redmineService: RedmineService;
  private captchaService: CaptchaService;
  
  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }
  
  private constructor() {
    this.redmineService = RedmineService.getInstance();
    this.captchaService = CaptchaService.getInstance();
  }
  
  async submitFeedback(
    feedbackRequest: FeedbackRequest,
    files: Express.Multer.File[] = [],
    metadata: { ip: string; userAgent?: string }
  ): Promise<FeedbackResponse> {
    const feedbackId = uuidv4();
    
    try {
      // Verify captcha first
      const isCaptchaValid = await this.captchaService.verifyCaptcha(
        feedbackRequest.captchaId,
        feedbackRequest.captcha
      );
      
      if (!isCaptchaValid) {
        throw new AppError('验证码验证失败，请重新输入', 400, 'CAPTCHA_INVALID');
      }
      
      // Create feedback data object
      const feedbackData: FeedbackData = {
        id: feedbackId,
        type: feedbackRequest.type,
        description: feedbackRequest.description,
        contact: feedbackRequest.contact,
        attachments: [],
        metadata: {
          ip: metadata.ip,
          userAgent: metadata.userAgent,
          timestamp: new Date(),
          source: 'web'
        },
        status: 'submitted'
      };
      
      logger.info('Processing feedback submission', {
        feedbackId,
        type: feedbackRequest.type,
        hasFiles: files.length > 0,
        fileCount: files.length
      });
      
      // Process file uploads
      const uploadTokens = [];
      const attachments: FileAttachment[] = [];
      
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            // Upload to Redmine
            const uploadResult = await this.redmineService.uploadFile(file);
            
            uploadTokens.push({
              token: uploadResult.token,
              filename: uploadResult.filename,
              content_type: uploadResult.content_type
            });
            
            // Create attachment record
            const attachment: FileAttachment = {
              id: uuidv4(),
              filename: file.filename,
              originalName: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: file.path,
              uploadedAt: new Date(),
              redmineToken: uploadResult.token
            };
            
            attachments.push(attachment);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Error processing file upload', {
              feedbackId,
              filename: file.originalname,
              error: message
            });
            
            // Clean up the file
            this.cleanupFile(file.path);
            
            // Continue with other files, but log the error
            // In production, you might want to fail the entire request
          }
        }
      }
      
      feedbackData.attachments = attachments;
      
      // Create issue in Redmine
      try {
        const issueId = await this.redmineService.createIssue(feedbackData, uploadTokens);
        feedbackData.redmine = {
          issueId,
          status: 'open'
        };
        feedbackData.status = 'processing';
        
        logger.info('Feedback submitted successfully', {
          feedbackId,
          issueId,
          attachmentCount: attachments.length
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error creating Redmine issue', {
          feedbackId,
          error: message
        });
        
        // Clean up uploaded files
        files.forEach(file => this.cleanupFile(file.path));
        
        throw error;
      }
      
      // Clean up temporary files after successful submission
      files.forEach(file => this.cleanupFile(file.path));
      
      // Return response
      const response: FeedbackResponse = {
        id: feedbackData.id,
        issueId: feedbackData.redmine?.issueId,
        status: feedbackData.status,
        submittedAt: feedbackData.metadata.timestamp.toISOString()
      };
      
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error submitting feedback', {
        feedbackId,
        error: message
      });
      
      // Clean up files on error
      files.forEach(file => this.cleanupFile(file.path));
      
      throw error;
    }
  }
  
  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.debug('Cleaned up temporary file', { filePath });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Error cleaning up temporary file', {
        filePath,
        error: message
      });
    }
  }
  
  // Method to get feedback status (for future implementation)
  async getFeedbackStatus(feedbackId: string): Promise<any> {
    // This would typically query a database
    // For now, return a placeholder
    throw new AppError('功能暂未实现', 501, 'NOT_IMPLEMENTED');
  }
  
  // Method to get feedback statistics (for future implementation)
  async getFeedbackStats(): Promise<any> {
    // This would typically query a database for statistics
    // For now, return a placeholder
    throw new AppError('功能暂未实现', 501, 'NOT_IMPLEMENTED');
  }
}