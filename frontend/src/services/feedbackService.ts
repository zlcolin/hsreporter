import type { FormData } from '@/types/common';
import { api, type EnhancedRequestConfig } from './api';

export interface FeedbackSubmissionResult {
  success: boolean;
  issueId?: number;
  message?: string;
  error?: string;
}

export interface FeedbackStatusResult {
  success: boolean;
  status?: string;
  issueId?: number;
  message?: string;
  error?: string;
}

export interface FeedbackStatsResult {
  success: boolean;
  stats?: {
    total: number;
    byType: Record<string, number>;
    recent: number;
  };
  message?: string;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  message?: string;
  error?: string;
}

/**
 * 反馈服务类 - 统一的反馈相关API接口
 */
export class FeedbackService {
  private static instance: FeedbackService;

  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  /**
   * 提交反馈
   */
  async submitFeedback(formData: FormData): Promise<FeedbackSubmissionResult> {
    try {
      const config: EnhancedRequestConfig = {
        retry: {
          retries: 2,
          retryDelay: 1000,
          retryCondition: error => {
            // 只对网络错误和服务器错误重试，不对客户端错误重试
            return (
              error.code === 'NETWORK_ERROR' ||
              (error.response?.status >= 500 && error.response?.status !== 501)
            );
          },
        },
      };

      const response = await api.post<{ issueId: number }>('/submit', formData, config);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          issueId: response.data.data.issueId,
          message: response.data.message || '提交成功',
        };
      } else {
        return {
          success: false,
          error: response.data.message || '提交失败',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * 查询反馈状态
   */
  async getFeedbackStatus(id: string): Promise<FeedbackStatusResult> {
    try {
      const config: EnhancedRequestConfig = {
        cache: {
          enabled: true,
          ttl: 30 * 1000, // 30秒缓存
        },
        retry: {
          retries: 3,
          retryDelay: 500,
        },
      };

      const response = await api.get<{ status: string; issueId?: number }>(
        `/feedback/${id}`,
        config
      );

      if (response.data.success && response.data.data) {
        return {
          success: true,
          status: response.data.data.status,
          issueId: response.data.data.issueId,
          message: response.data.message,
        };
      } else {
        return {
          success: false,
          error: response.data.message || '查询失败',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * 获取反馈统计信息
   */
  async getFeedbackStats(): Promise<FeedbackStatsResult> {
    try {
      const config: EnhancedRequestConfig = {
        cache: {
          enabled: true,
          ttl: 5 * 60 * 1000, // 5分钟缓存
        },
        retry: {
          retries: 2,
          retryDelay: 1000,
        },
      };

      const response = await api.get<{
        total: number;
        byType: Record<string, number>;
        recent: number;
      }>('/feedback/stats', config);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          stats: response.data.data,
          message: response.data.message,
        };
      } else {
        return {
          success: false,
          error: response.data.message || '获取统计信息失败',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const config: EnhancedRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressEvent => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
        retry: {
          retries: 1, // 文件上传只重试一次
          retryDelay: 2000,
          retryCondition: error => {
            // 只对网络错误重试
            return error.code === 'NETWORK_ERROR';
          },
        },
      };

      const response = await api.post<{ fileId: string; url: string }>('/upload', formData, config);

      if (response.data.success && response.data.data) {
        return {
          success: true,
          fileId: response.data.data.fileId,
          url: response.data.data.url,
          message: response.data.message || '上传成功',
        };
      } else {
        return {
          success: false,
          error: response.data.message || '上传失败',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(
    fileId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const config: EnhancedRequestConfig = {
        retry: {
          retries: 2,
          retryDelay: 1000,
        },
      };

      const response = await api.delete(`/upload/${fileId}`, config);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || '删除成功',
        };
      } else {
        return {
          success: false,
          error: response.data.message || '删除失败',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    api.cache.clear();
  }

  /**
   * 清除特定缓存
   */
  clearSpecificCache(pattern: string): void {
    // 这里可以实现更复杂的缓存清理逻辑
    // 目前简单清除所有缓存
    api.cache.clear();
  }

  /**
   * 提取错误信息
   */
  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.message) {
      return error.message;
    }

    if (error.code === 'NETWORK_ERROR') {
      return '网络连接失败，请检查网络设置';
    }

    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return '请求参数错误';
        case 401:
          return '未授权访问';
        case 403:
          return '禁止访问';
        case 404:
          return '请求的资源不存在';
        case 429:
          return '请求过于频繁，请稍后重试';
        case 500:
          return '服务器内部错误';
        case 502:
          return '网关错误';
        case 503:
          return '服务暂时不可用';
        default:
          return `请求失败 (${error.response.status})`;
      }
    }

    return '未知错误';
  }
}

// 导出单例实例
export const feedbackService = FeedbackService.getInstance();
export default feedbackService;
