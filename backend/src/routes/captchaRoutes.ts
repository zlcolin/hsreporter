import { Router } from 'express';
import { CaptchaController } from '../controllers/captchaController';
import { validateCaptchaVerification } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const captchaController = new CaptchaController();

// 生成验证码 - 限制频率防止滥用
router.get('/generate', 
  rateLimiter.captchaGenerate,
  captchaController.generateCaptcha
);

// 验证验证码 - 限制频率防止暴力破解
router.post('/verify',
  rateLimiter.captchaVerify,
  validateCaptchaVerification,
  captchaController.verifyCaptcha
);

// 刷新验证码 - 限制频率
router.post('/refresh',
  rateLimiter.captchaGenerate,
  captchaController.refreshCaptcha
);

// 获取验证码统计信息（仅开发环境或管理员）
if (process.env.NODE_ENV === 'development') {
  router.get('/stats', captchaController.getCaptchaStats);
}

export { router as captchaRoutes };