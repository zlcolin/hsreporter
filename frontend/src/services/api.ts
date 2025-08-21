import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

// 缓存配置接口
export interface CacheConfig {
  ttl?: number; // 缓存时间（毫秒）
  key?: string; // 自定义缓存键
  enabled?: boolean; // 是否启用缓存
}

// 重试配置接口
export interface RetryConfig {
  retries?: number; // 重试次数
  retryDelay?: number; // 重试延迟（毫秒）
  retryCondition?: (error: any) => boolean; // 重试条件
}

// 请求配置扩展
export interface EnhancedRequestConfig extends AxiosRequestConfig {
  cache?: CacheConfig;
  retry?: RetryConfig;
  skipInterceptors?: boolean;
}

// 缓存项接口
interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

// 内存缓存管理
class MemoryCache {
  private cache = new Map<string, CacheItem>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 创建缓存实例
const cache = new MemoryCache();

// 定期清理过期缓存
setInterval(() => cache.cleanup(), 60000); // 每分钟清理一次

// 创建axios实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 添加请求ID用于追踪
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    config.headers = {
      ...config.headers,
      'X-Request-ID': requestId,
    };

    // 在开发环境下打印请求信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        requestId,
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  error => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 在开发环境下打印响应信息
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          requestId: response.config.headers?.['X-Request-ID'],
          data: response.data,
        }
      );
    }

    return response;
  },
  error => {
    // 统一错误处理
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;

      console.error(`[API Error] ${status}`, {
        url: error.config?.url,
        method: error.config?.method,
        requestId: error.config?.headers?.['X-Request-ID'],
        error: data,
      });

      // 根据状态码进行不同处理
      switch (status) {
        case 400:
          // 客户端错误，通常是参数验证失败
          break;
        case 401:
          // 未授权，可能需要重新登录
          break;
        case 403:
          // 禁止访问
          break;
        case 404:
          // 资源不存在
          break;
        case 429:
          // 请求过于频繁
          break;
        case 500:
          // 服务器内部错误
          break;
        default:
          break;
      }
    } else if (error.request) {
      // 网络错误
      console.error('[API Network Error]', {
        url: error.config?.url,
        method: error.config?.method,
        message: '网络连接失败，请检查网络设置',
      });
    } else {
      // 其他错误
      console.error('[API Unknown Error]', error.message);
    }

    return Promise.reject(error);
  }
);

// 重试逻辑
const retryRequest = async (
  requestFn: () => Promise<AxiosResponse>,
  config: RetryConfig = {}
): Promise<AxiosResponse> => {
  const { retries = 3, retryDelay = 1000, retryCondition } = config;

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      // 检查是否应该重试
      const shouldRetry = retryCondition
        ? retryCondition(error)
        : error.code === 'NETWORK_ERROR' ||
          error.response?.status >= 500 ||
          error.response?.status === 429;

      if (attempt === retries || !shouldRetry) {
        throw error;
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }

  throw lastError;
};

// 生成缓存键
const generateCacheKey = (method: string, url: string, params?: any, data?: any): string => {
  const key = `${method.toUpperCase()}:${url}`;
  if (params) {
    const paramStr = new URLSearchParams(params).toString();
    return `${key}?${paramStr}`;
  }
  if (data) {
    return `${key}:${JSON.stringify(data)}`;
  }
  return key;
};

// 增强的API方法
export const api = {
  get: async <T = any>(
    url: string,
    config: EnhancedRequestConfig = {}
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { cache: cacheConfig, retry: retryConfig, ...axiosConfig } = config;

    // 检查缓存
    if (cacheConfig?.enabled !== false) {
      const cacheKey = cacheConfig?.key || generateCacheKey('GET', url, axiosConfig.params);
      const cachedData = cache.get<AxiosResponse<ApiResponse<T>>>(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      // 执行请求并缓存结果
      const response = await retryRequest(() => apiClient.get(url, axiosConfig), retryConfig);

      const ttl = cacheConfig?.ttl || 5 * 60 * 1000; // 默认5分钟
      cache.set(cacheKey, response, ttl);

      return response;
    }

    return retryRequest(() => apiClient.get(url, axiosConfig), retryConfig);
  },

  post: async <T = any>(
    url: string,
    data?: any,
    config: EnhancedRequestConfig = {}
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { retry: retryConfig, ...axiosConfig } = config;
    return retryRequest(() => apiClient.post(url, data, axiosConfig), retryConfig);
  },

  put: async <T = any>(
    url: string,
    data?: any,
    config: EnhancedRequestConfig = {}
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { retry: retryConfig, ...axiosConfig } = config;
    return retryRequest(() => apiClient.put(url, data, axiosConfig), retryConfig);
  },

  delete: async <T = any>(
    url: string,
    config: EnhancedRequestConfig = {}
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { retry: retryConfig, ...axiosConfig } = config;
    return retryRequest(() => apiClient.delete(url, axiosConfig), retryConfig);
  },

  patch: async <T = any>(
    url: string,
    data?: any,
    config: EnhancedRequestConfig = {}
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    const { retry: retryConfig, ...axiosConfig } = config;
    return retryRequest(() => apiClient.patch(url, data, axiosConfig), retryConfig);
  },

  // 缓存管理方法
  cache: {
    get: <T>(key: string) => cache.get<T>(key),
    set: <T>(key: string, data: T, ttl?: number) => cache.set(key, data, ttl),
    delete: (key: string) => cache.delete(key),
    clear: () => cache.clear(),
    has: (key: string) => cache.has(key),
  },
};

// 具体的API服务函数
export const submitFeedback = async (formData: any): Promise<ApiResponse<{ issueId: number }>> => {
  try {
    const response = await api.post<{ issueId: number }>('/submit', formData, {
      retry: {
        retries: 2,
        retryDelay: 1000,
        retryCondition: error => {
          // 只对网络错误和服务器错误重试
          return (
            error.code === 'NETWORK_ERROR' ||
            (error.response?.status >= 500 && error.response?.status !== 501)
          );
        },
      },
    });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Submission failed',
      error: {
        code: error.response?.status?.toString() || 'NETWORK_ERROR',
        details: error.response?.data,
      },
      timestamp: new Date().toISOString(),
      requestId: error.config?.headers?.['X-Request-ID'] || '',
    };
  }
};

// 获取反馈状态
export const getFeedbackStatus = async (
  id: string
): Promise<ApiResponse<{ status: string; issueId?: number }>> => {
  try {
    const response = await api.get<{ status: string; issueId?: number }>(`/feedback/${id}`, {
      cache: {
        enabled: true,
        ttl: 30 * 1000, // 30秒缓存
      },
      retry: {
        retries: 3,
        retryDelay: 500,
      },
    });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to get feedback status',
      error: {
        code: error.response?.status?.toString() || 'NETWORK_ERROR',
        details: error.response?.data,
      },
      timestamp: new Date().toISOString(),
      requestId: error.config?.headers?.['X-Request-ID'] || '',
    };
  }
};

// 获取反馈统计
export const getFeedbackStats = async (): Promise<
  ApiResponse<{ total: number; byType: Record<string, number> }>
> => {
  try {
    const response = await api.get<{ total: number; byType: Record<string, number> }>(
      '/feedback/stats',
      {
        cache: {
          enabled: true,
          ttl: 5 * 60 * 1000, // 5分钟缓存
        },
        retry: {
          retries: 2,
          retryDelay: 1000,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to get feedback stats',
      error: {
        code: error.response?.status?.toString() || 'NETWORK_ERROR',
        details: error.response?.data,
      },
      timestamp: new Date().toISOString(),
      requestId: error.config?.headers?.['X-Request-ID'] || '',
    };
  }
};

export default api;
