import { Request, Response, NextFunction } from 'express';
import { UploadService, ProcessedFile } from '@/services/uploadService';
import { AppError } from '@/middleware/errorHandler';
import logger from '@/utils/logger';

export class UploadController {
  /**
   * Handle file upload with validation and processing
   */
  async uploadFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw new AppError('没有上传文件', 400, 'NO_FILES_UPLOADED');
      }

      const processedFiles: Array<{
        file: Express.Multer.File;
        processed: ProcessedFile;
        info: any;
      }> = [];

      const filesToCleanup: string[] = [];

      try {
        // Validate and process each file
        for (const file of files) {
          // Detailed validation
          const validation = await UploadService.validateFile(file);
          if (!validation.isValid) {
            throw new AppError(validation.error || '文件验证失败', 400, 'FILE_VALIDATION_ERROR');
          }

          // Process file (compression, optimization)
          const processed = await UploadService.processFile(file);
          const fileInfo = UploadService.getFileInfo(file, processed);

          processedFiles.push({
            file,
            processed,
            info: fileInfo
          });

          // Track files for cleanup if needed
          if (processed.processedPath !== processed.originalPath) {
            filesToCleanup.push(processed.originalPath);
          }

          logger.info('File processed successfully', {
            originalName: file.originalname,
            filename: file.filename,
            originalSize: processed.originalSize,
            processedSize: processed.processedSize,
            compressionRatio: processed.compressionRatio
          });
        }

        // Return file information
        const response = {
          success: true,
          message: '文件上传成功',
          data: {
            files: processedFiles.map(pf => pf.info),
            totalFiles: processedFiles.length,
            totalSize: processedFiles.reduce((sum, pf) => sum + pf.processed.processedSize, 0),
            totalOriginalSize: processedFiles.reduce((sum, pf) => sum + pf.processed.originalSize, 0)
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string
        };

        res.status(200).json(response);

        // Cleanup original files if they were compressed
        if (filesToCleanup.length > 0) {
          setTimeout(() => {
            UploadService.cleanupFiles(filesToCleanup);
          }, 1000); // Delay cleanup to ensure response is sent
        }

      } catch (error) {
        // Cleanup all uploaded files on error
        const allFiles = files.map(f => f.path);
        UploadService.cleanupFiles(allFiles);
        throw error;
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        throw new AppError('文件ID是必需的', 400, 'FILE_ID_REQUIRED');
      }

      // In a real application, you would look up the file in a database
      // For now, we'll just return success
      const response = {
        success: true,
        message: '文件删除成功',
        data: { fileId },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        throw new AppError('文件ID是必需的', 400, 'FILE_ID_REQUIRED');
      }

      // In a real application, you would look up the file in a database
      const response = {
        success: true,
        message: '获取文件信息成功',
        data: {
          id: fileId,
          // Add file information here
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);

    } catch (error) {
      next(error);
    }
  }
}