import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '@/types/api';
import logger from '@/utils/logger';

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const requestId = req.headers['x-request-id'] as string || 'unknown';
      
      logger.warn('Validation error', {
        requestId,
        url: req.url,
        method: req.method,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });

      const response: ApiResponse = {
        success: false,
        message: '输入数据验证失败',
        error: {
          code: 'VALIDATION_ERROR',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        },
        timestamp: new Date().toISOString(),
        requestId
      };

      res.status(400).json(response);
      return;
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// 验证码验证的 Joi schema
const captchaVerificationSchema = Joi.object({
  captchaId: Joi.string()
    .required()
    .pattern(/^captcha_\d+_[a-z0-9]+$/)
    .messages({
      'string.empty': '验证码ID不能为空',
      'string.pattern.base': '验证码ID格式无效',
      'any.required': '验证码ID是必需的'
    }),
  code: Joi.string()
    .required()
    .length(4)
    .pattern(/^\d{4}$/)
    .messages({
      'string.empty': '验证码不能为空',
      'string.length': '验证码必须是4位数字',
      'string.pattern.base': '验证码只能包含数字',
      'any.required': '验证码是必需的'
    })
});

// 验证码验证中间件
export const validateCaptchaVerification = validateRequest(captchaVerificationSchema);