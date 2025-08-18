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

// 通用API方法
export const api = {
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => apiClient.get(url, config),

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => apiClient.post(url, data, config),

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => apiClient.put(url, data, config),

  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => apiClient.delete(url, config),

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> => apiClient.patch(url, data, config),
};

// Specific API functions
export const submitFeedback = async (formData: any): Promise<ApiResponse<{ issueId: number }>> => {
  try {
    const response = await api.post<{ issueId: number }>('/submit', formData);
    return response.data;
  } catch (error: any) {
    // Return a standardized error response
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

export default api;
