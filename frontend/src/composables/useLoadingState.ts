import { computed, reactive, readonly } from 'vue';

export interface LoadingState {
  loading: boolean;
  progress: number;
  message: string;
  error: string | null;
}

export interface LoadingOptions {
  message?: string;
  showProgress?: boolean;
  timeout?: number;
}

export function useLoadingState(initialState: Partial<LoadingState> = {}) {
  const state = reactive<LoadingState>({
    loading: false,
    progress: 0,
    message: '',
    error: null,
    ...initialState,
  });

  const isLoading = computed(() => state.loading);
  const hasError = computed(() => state.error !== null);
  const isComplete = computed(() => state.progress >= 100);

  // 开始加载
  const startLoading = (options: LoadingOptions = {}) => {
    state.loading = true;
    state.progress = 0;
    state.message = options.message || '加载中...';
    state.error = null;

    // 设置超时
    if (options.timeout) {
      setTimeout(() => {
        if (state.loading) {
          setError('操作超时，请重试');
        }
      }, options.timeout);
    }
  };

  // 更新进度
  const updateProgress = (progress: number, message?: string) => {
    state.progress = Math.min(Math.max(progress, 0), 100);
    if (message) {
      state.message = message;
    }
  };

  // 设置错误
  const setError = (error: string) => {
    state.loading = false;
    state.error = error;
    state.progress = 0;
  };

  // 完成加载
  const finishLoading = (message?: string) => {
    state.loading = false;
    state.progress = 100;
    state.error = null;
    if (message) {
      state.message = message;
    }
  };

  // 重置状态
  const reset = () => {
    state.loading = false;
    state.progress = 0;
    state.message = '';
    state.error = null;
  };

  // 模拟进度更新
  const simulateProgress = (duration: number = 2000, steps: number = 10) => {
    const stepDuration = duration / steps;
    const stepProgress = 100 / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      updateProgress(currentStep * stepProgress);

      if (currentStep >= steps) {
        clearInterval(interval);
        finishLoading();
      }
    }, stepDuration);

    return interval;
  };

  return {
    state: readonly(state),
    isLoading,
    hasError,
    isComplete,
    startLoading,
    updateProgress,
    setError,
    finishLoading,
    reset,
    simulateProgress,
  };
}

// 全局加载状态管理
const globalLoadingState = useLoadingState();

export function useGlobalLoading() {
  return globalLoadingState;
}

// 多个加载状态管理
export function useMultipleLoadingStates() {
  const states = reactive<Record<string, LoadingState>>({});

  const createLoadingState = (key: string, initialState?: Partial<LoadingState>) => {
    states[key] = reactive<LoadingState>({
      loading: false,
      progress: 0,
      message: '',
      error: null,
      ...initialState,
    });
    return states[key];
  };

  const getLoadingState = (key: string) => {
    return states[key];
  };

  const removeLoadingState = (key: string) => {
    delete states[key];
  };

  const isAnyLoading = computed(() => {
    return Object.values(states).some(state => state.loading);
  });

  const hasAnyError = computed(() => {
    return Object.values(states).some(state => state.error !== null);
  });

  return {
    states: readonly(states),
    createLoadingState,
    getLoadingState,
    removeLoadingState,
    isAnyLoading,
    hasAnyError,
  };
}
