import { Request, Response } from 'express';
import { CaptchaService } from '../services/captchaService';
import { logger } from '../utils/logger';

export class CaptchaController {
  private captchaService: CaptchaService;

  constructor() {
    this.captchaService = new CaptchaService();
  }

  /**
   * 生成验证码
   */
  generateCaptcha = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.captchaService.generateCaptcha();
      
      logger.info('Captcha generated successfully', {
        captchaId: result.captchaId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        data: {
          imageUrl: result.imageUrl,
          captchaId: result.captchaId,
          expiresIn: result.expiresIn
        },
        message: '验证码生成成功'
      });
    } catch (error) {
      logger.error('Failed to generate captcha', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(500).json({
        success: false,
        message: '验证码生成失败，请稍后重试',
        error: {
          code: 'CAPTCHA_GENERATION_FAILED'
        }
      });
    }
  };

  /**
   * 验证验证码
   */
  verifyCaptcha = async (req: Request, res: Response): Promise<void> => {
    try {
      const { captchaId, code } = req.body;

      // 输入验证
      if (!captchaId || !code) {
        logger.warn('Captcha verification failed - missing parameters', {
          captchaId: !!captchaId,
          code: !!code,
          ip: req.ip
        });

        res.status(400).json({
          success: false,
          message: '请填入完整的验证码信息',
          error: {
            code: 'MISSING_CAPTCHA_PARAMS'
          }
        });
        return;
      }

      const result = await this.captchaService.verifyCaptcha(captchaId, code);

      if (result.success) {
        logger.info('Captcha verification successful', {
          captchaId,
          ip: req.ip
        });

        res.status(200).json({
          success: true,
          message: '验证码验证成功'
        });
      } else {
        logger.warn('Captcha verification failed', {
          captchaId,
          reason: result.reason,
          ip: req.ip
        });

        res.status(400).json({
          success: false,
          message: result.message,
          error: {
            code: result.reason
          }
        });
      }
    } catch (error) {
      logger.error('Captcha verification error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        captchaId: req.body?.captchaId,
        ip: req.ip
      });

      res.status(500).json({
        success: false,
        message: '验证码验证失败，请稍后重试',
        error: {
          code: 'CAPTCHA_VERIFICATION_ERROR'
        }
      });
    }
  };

  /**
   * 刷新验证码（删除旧的，生成新的）
   */
  refreshCaptcha = async (req: Request, res: Response): Promise<void> => {
    try {
      const { captchaId } = req.body;

      // 如果提供了旧的验证码ID，先删除它
      if (captchaId) {
        await this.captchaService.invalidateCaptcha(captchaId);
        logger.info('Old captcha invalidated', { captchaId, ip: req.ip });
      }

      // 生成新的验证码
      const result = await this.captchaService.generateCaptcha();

      logger.info('Captcha refreshed successfully', {
        oldCaptchaId: captchaId,
        newCaptchaId: result.captchaId,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        data: {
          imageUrl: result.imageUrl,
          captchaId: result.captchaId,
          expiresIn: result.expiresIn
        },
        message: '验证码刷新成功'
      });
    } catch (error) {
      logger.error('Failed to refresh captcha', {
        error: error instanceof Error ? error.message : 'Unknown error',
        oldCaptchaId: req.body?.captchaId,
        ip: req.ip
      });

      res.status(500).json({
        success: false,
        message: '验证码刷新失败，请稍后重试',
        error: {
          code: 'CAPTCHA_REFRESH_FAILED'
        }
      });
    }
  };

  /**
   * 获取验证码统计信息（用于监控）
   */
  getCaptchaStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.captchaService.getStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: '验证码统计信息获取成功'
      });
    } catch (error) {
      logger.error('Failed to get captcha stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: '获取统计信息失败',
        error: {
          code: 'CAPTCHA_STATS_ERROR'
        }
      });
    }
  };
}