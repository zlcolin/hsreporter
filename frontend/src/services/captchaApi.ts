import { apiClient } from './api';

export interface CaptchaGenerateResponse {
  imageUrl: string;
  captchaId: string;
  expiresIn: number;
}

export interface CaptchaVerifyResponse {
  success: boolean;
  message: string;
  error?: {
    code: string;
    details?: any;
  };
}

export interface CaptchaStatsResponse {
  totalActive: number;
  totalGenerated: number;
  totalVerified: number;
  totalExpired: number;
  totalFailed: number;
}

class CaptchaApi {
  private readonly baseUrl = '/v1/captcha';

  /**
   * 生成验证码
   */
  async generate(): Promise<CaptchaGenerateResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/generate`);

      if (!response.data.success) {
        throw new Error(response.data.message || '生成验证码失败');
      }

      return response.data.data;
    } catch (error) {
      console.error('Generate captcha error:', error);
      throw new Error('生成验证码失败，请稍后重试');
    }
  }

  /**
   * 验证验证码
   */
  async verify(captchaId: string, code: string): Promise<CaptchaVerifyResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/verify`, {
        captchaId,
        code,
      });

      return {
        success: response.data.success,
        message: response.data.message,
        error: response.data.error,
      };
    } catch (error: any) {
      console.error('Verify captcha error:', error);

      // 如果是HTTP错误响应，返回服务器的错误信息
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || '验证码验证失败',
          error: error.response.data.error,
        };
      }

      // 网络错误或其他错误
      return {
        success: false,
        message: '验证码验证失败，请检查网络连接',
        error: {
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  /**
   * 刷新验证码
   */
  async refresh(oldCaptchaId?: string): Promise<CaptchaGenerateResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/refresh`, {
        captchaId: oldCaptchaId,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || '刷新验证码失败');
      }

      return response.data.data;
    } catch (error) {
      console.error('Refresh captcha error:', error);
      throw new Error('刷新验证码失败，请稍后重试');
    }
  }

  /**
   * 获取验证码统计信息（仅开发环境）
   */
  async getStats(): Promise<CaptchaStatsResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`);

      if (!response.data.success) {
        throw new Error(response.data.message || '获取统计信息失败');
      }

      return response.data.data;
    } catch (error) {
      console.error('Get captcha stats error:', error);
      throw new Error('获取统计信息失败');
    }
  }

  /**
   * 验证验证码格式
   */
  validateCaptchaFormat(code: string): boolean {
    return /^\d{4}$/.test(code);
  }

  /**
   * 验证验证码ID格式
   */
  validateCaptchaIdFormat(captchaId: string): boolean {
    return /^captcha_\d+_[a-z0-9]+$/.test(captchaId);
  }
}

export const captchaApi = new CaptchaApi();
