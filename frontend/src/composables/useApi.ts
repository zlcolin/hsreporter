import { computed, ref, type Ref } from 'vue';
import { useNotification } from './useNotification';

export interface ApiState<T = any> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  lastUpdated: Ref<Date | null>;
}

export interface ApiOptions {
  immediate?: boolean;
  showErrorNotification?: boolean;
  showSuccessNotification?: boolean;
  successMessage?: string;
  errorMessage?: string;
  retries?: number;
  retryDelay?: number;
}

/**
 * 通用API调用组合式函数
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: ApiOptions = {}
) {
  const {
    immediate = false,
    showErrorNotification = true,
    showSuccessNotification = false,
    successMessage,
    errorMessage,
    retries = 0,
    retryDelay = 1000,
  } = options;

  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<Date | null>(null);

  const { showError, showSuccess } = useNotification();

  const isSuccess = computed(() => data.value !== null && error.value === null);
  const hasError = computed(() => error.value !== null);

  const execute = async (...args: any[]): Promise<T | null> => {
    loading.value = true;
    error.value = null;

    let attempt = 0;
    const maxAttempts = retries + 1;

    while (attempt < maxAttempts) {
      try {
        const result = await apiFunction(...args);
        data.value = result;
        lastUpdated.value = new Date();

        if (showSuccessNotification && successMessage) {
          showSuccess(successMessage);
        }

        return result;
      } catch (err: any) {
        attempt++;

        if (attempt >= maxAttempts) {
          const errorMsg = err.message || errorMessage || 'API调用失败';
          error.value = errorMsg;

          if (showErrorNotification) {
            showError(errorMsg);
          }

          throw err;
        } else {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      } finally {
        if (attempt >= maxAttempts) {
          loading.value = false;
        }
      }
    }

    return null;
  };

  const refresh = () => execute();

  const reset = () => {
    data.value = null;
    error.value = null;
    loading.value = false;
    lastUpdated.value = null;
  };

  // 如果设置了immediate，立即执行
  if (immediate) {
    execute();
  }

  return {
    data,
    loading,
    error,
    lastUpdated,
    isSuccess,
    hasError,
    execute,
    refresh,
    reset,
  };
}

/**
 * 分页API调用组合式函数
 */
export function usePaginatedApi<T = any>(
  apiFunction: (
    page: number,
    pageSize: number,
    ...args: any[]
  ) => Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
  }>,
  options: ApiOptions & { pageSize?: number } = {}
) {
  const { pageSize = 10, ...apiOptions } = options;

  const currentPage = ref(1);
  const currentPageSize = ref(pageSize);
  const total = ref(0);
  const items = ref<T[]>([]);

  const {
    data,
    loading,
    error,
    lastUpdated,
    isSuccess,
    hasError,
    execute: executeApi,
    reset: resetApi,
  } = useApi(apiFunction, apiOptions);

  const totalPages = computed(() => Math.ceil(total.value / currentPageSize.value));
  const hasNextPage = computed(() => currentPage.value < totalPages.value);
  const hasPrevPage = computed(() => currentPage.value > 1);

  const execute = async (...args: any[]) => {
    const result = await executeApi(currentPage.value, currentPageSize.value, ...args);

    if (result) {
      items.value = result.data;
      total.value = result.total;
      currentPage.value = result.page;
      currentPageSize.value = result.pageSize;
    }

    return result;
  };

  const nextPage = async (...args: any[]) => {
    if (hasNextPage.value) {
      currentPage.value++;
      return execute(...args);
    }
  };

  const prevPage = async (...args: any[]) => {
    if (hasPrevPage.value) {
      currentPage.value--;
      return execute(...args);
    }
  };

  const goToPage = async (page: number, ...args: any[]) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      return execute(...args);
    }
  };

  const changePageSize = async (newPageSize: number, ...args: any[]) => {
    currentPageSize.value = newPageSize;
    currentPage.value = 1; // 重置到第一页
    return execute(...args);
  };

  const reset = () => {
    currentPage.value = 1;
    currentPageSize.value = pageSize;
    total.value = 0;
    items.value = [];
    resetApi();
  };

  return {
    // 数据状态
    items,
    total,
    currentPage,
    currentPageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,

    // API状态
    data,
    loading,
    error,
    lastUpdated,
    isSuccess,
    hasError,

    // 操作方法
    execute,
    nextPage,
    prevPage,
    goToPage,
    changePageSize,
    reset,
  };
}

/**
 * 无限滚动API调用组合式函数
 */
export function useInfiniteApi<T = any>(
  apiFunction: (
    page: number,
    pageSize: number,
    ...args: any[]
  ) => Promise<{
    data: T[];
    hasMore: boolean;
    nextPage?: number;
  }>,
  options: ApiOptions & { pageSize?: number } = {}
) {
  const { pageSize = 10, ...apiOptions } = options;

  const currentPage = ref(1);
  const currentPageSize = ref(pageSize);
  const items = ref<T[]>([]);
  const hasMore = ref(true);

  const {
    loading,
    error,
    lastUpdated,
    isSuccess,
    hasError,
    execute: executeApi,
    reset: resetApi,
  } = useApi(apiFunction, apiOptions);

  const loadMore = async (...args: any[]) => {
    if (!hasMore.value || loading.value) return;

    const result = await executeApi(currentPage.value, currentPageSize.value, ...args);

    if (result) {
      items.value.push(...result.data);
      hasMore.value = result.hasMore;

      if (result.nextPage) {
        currentPage.value = result.nextPage;
      } else {
        currentPage.value++;
      }
    }

    return result;
  };

  const refresh = async (...args: any[]) => {
    currentPage.value = 1;
    items.value = [];
    hasMore.value = true;
    return loadMore(...args);
  };

  const reset = () => {
    currentPage.value = 1;
    items.value = [];
    hasMore.value = true;
    resetApi();
  };

  return {
    items,
    hasMore,
    currentPage,
    loading,
    error,
    lastUpdated,
    isSuccess,
    hasError,
    loadMore,
    refresh,
    reset,
  };
}

/**
 * 缓存API调用组合式函数
 */
export function useCachedApi<T = any>(
  key: string,
  apiFunction: (...args: any[]) => Promise<T>,
  options: ApiOptions & {
    cacheTime?: number;
    staleTime?: number;
  } = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5分钟缓存时间
    staleTime = 30 * 1000, // 30秒过期时间
    ...apiOptions
  } = options;

  const cacheKey = `cached_api_${key}`;
  const timestampKey = `${cacheKey}_timestamp`;

  const {
    data,
    loading,
    error,
    lastUpdated,
    isSuccess,
    hasError,
    execute: executeApi,
    reset: resetApi,
  } = useApi(apiFunction, apiOptions);

  const isStale = computed(() => {
    const timestamp = localStorage.getItem(timestampKey);
    if (!timestamp) return true;

    const age = Date.now() - parseInt(timestamp);
    return age > staleTime;
  });

  const loadFromCache = (): boolean => {
    try {
      const cachedData = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);

      if (cachedData && timestamp) {
        const age = Date.now() - parseInt(timestamp);

        if (age < cacheTime) {
          data.value = JSON.parse(cachedData);
          lastUpdated.value = new Date(parseInt(timestamp));
          return true;
        }
      }
    } catch (err) {
      console.warn('Failed to load from cache:', err);
    }

    return false;
  };

  const saveToCache = (result: T) => {
    try {
      const timestamp = Date.now().toString();
      localStorage.setItem(cacheKey, JSON.stringify(result));
      localStorage.setItem(timestampKey, timestamp);
    } catch (err) {
      console.warn('Failed to save to cache:', err);
    }
  };

  const execute = async (...args: any[]): Promise<T | null> => {
    // 先尝试从缓存加载
    if (loadFromCache() && !isStale.value) {
      return data.value;
    }

    // 缓存未命中或已过期，执行API调用
    const result = await executeApi(...args);

    if (result) {
      saveToCache(result);
    }

    return result;
  };

  const clearCache = () => {
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(timestampKey);
  };

  const reset = () => {
    clearCache();
    resetApi();
  };

  // 初始化时尝试从缓存加载
  if (!apiOptions.immediate) {
    loadFromCache();
  }

  return {
    data,
    loading,
    error,
    lastUpdated,
    isSuccess,
    hasError,
    isStale,
    execute,
    clearCache,
    reset,
  };
}
