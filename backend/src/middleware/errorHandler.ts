import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types/api';
import logger from '@/utils/logger';
import { ValidationError } from './validation';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const getErrorMessage = (err: Error): string => {
  if (err instanceof ValidationError) {
    return '输入数据验证失败';
  }
  if (err instanceof AppError) {
    return err.message;
  }
  if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    return '请求数据格式错误，请提供有效的JSON';
  }
  if (err.name === 'MulterError') {
    return '文件上传错误: ' + err.message;
  }
  if (err.message.includes('ECONNREFUSED')) {
    return '服务连接失败，请稍后重试';
  }
  if (err.message.includes('timeout')) {
    return '请求超时，请稍后重试';
  }
  return '服务器内部错误，请稍后重试';
};

export const getErrorCode = (err: Error): string => {
  if (err instanceof ValidationError) {
    return 'VALIDATION_ERROR';
  }
  if (err instanceof AppError) {
    return err.code;
  }
  if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    return 'INVALID_JSON_FORMAT';
  }
  if (err.name === 'MulterError') {
    return 'FILE_UPLOAD_ERROR';
  }
  if (err.message.includes('ECONNREFUSED')) {
    return 'CONNECTION_ERROR';
  }
  if (err.message.includes('timeout')) {
    return 'TIMEOUT_ERROR';
  }
  return 'INTERNAL_ERROR';
};

export const getStatusCode = (err: Error): number => {
  if (err instanceof ValidationError) {
    return 400;
  }
  if (err instanceof AppError) {
    return err.statusCode;
  }
  if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    return 400;
  }
  if (err.name === 'MulterError') {
    return 400;
  }
  if (err.message.includes('ECONNREFUSED')) {
    return 503;
  }
  if (err.message.includes('timeout')) {
    return 504;
  }
  return 500;
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  // Log error details
  logger.error('API Error', {
    error: err.message,
    stack: err.stack,
    requestId,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  
  // Prepare error response
  const response: ApiResponse = {
    success: false,
    message: getErrorMessage(err),
    error: {
      code: getErrorCode(err),
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    timestamp: new Date().toISOString(),
    requestId
  };
  
  const statusCode = getStatusCode(err);
  res.status(statusCode).json(response);
};

// Handle 404 errors
export const notFoundHandler = (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  const response: ApiResponse = {
    success: false,
    message: '请求的资源不存在',
    error: {
      code: 'NOT_FOUND'
    },
    timestamp: new Date().toISOString(),
    requestId
  };
  
  res.status(404).json(response);
};