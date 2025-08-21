import { computed, reactive, readonly } from 'vue';

export interface LoadingStep {
  id: string;
  title: string;
  description?: string;
  weight?: number;
  status?: 'pending' | 'loading' | 'success' | 'error';
}

export interface LoadingState {
  loading: boolean;
  progress: number;
  message: string;
  error: string | null;
  startTime: number | null;
  steps: LoadingStep[];
  currentStepIndex: number;
  estimatedTimeRemaining: number | null;
}

export interface LoadingOptions {
  message?: string;
  showProgress?: boolean;
  timeout?: number;
  steps?: LoadingStep[];
  estimateTime?: boolean;
}

export function useLoadingState(initialState: Partial<LoadingState> = {}) {
  const state = reactive<LoadingState>({
    loading: false,
    progress: 0,
    message: '',
    error: null,
    startTime: null,
    steps: [],
    currentStepIndex: -1,
    estimatedTimeRemaining: null,
    ...initialState,
  });

  const isLoading = computed(() => state.loading);
  const hasError = computed(() => state.error !== null);
  const isComplete = computed(() => state.progress >= 100);

  const duration = computed(() => {
    if (!state.startTime) return 0;
    return Date.now() - state.startTime;
  });

  const currentStep = computed(() => {
    if (state.currentStepIndex >= 0 && state.currentStepIndex < state.steps.length) {
      return state.steps[state.currentStepIndex];
    }
    return null;
  });

  const completedSteps = computed(() => {
    return state.steps.filter(step => step.status === 'success').length;
  });

  const formatTimeRemaining = computed(() => {
    if (!state.estimatedTimeRemaining) return null;

    const seconds = Math.ceil(state.estimatedTimeRemaining / 1000);
    if (seconds < 60) return `约 ${seconds} 秒`;

    const minutes = Math.ceil(seconds / 60);
    return `约 ${minutes} 分钟`;
  });

  // 开始加载
  const startLoading = (options: LoadingOptions = {}) => {
    state.loading = true;
    state.progress = 0;
    state.message = options.message || '加载中...';
    state.error = null;
    state.startTime = Date.now();
    state.estimatedTimeRemaining = null;

    if (options.steps) {
      state.steps = options.steps.map(step => ({
        ...step,
        status: 'pending',
        weight: step.weight || 1,
      }));
      state.currentStepIndex = -1;
    }

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

    // 估算剩余时间
    if (state.startTime && progress > 0 && progress < 100) {
      const elapsed = Date.now() - state.startTime;
      const estimatedTotal = (elapsed / progress) * 100;
      state.estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
    }
  };

  // 进入下一步
  const nextStep = (message?: string) => {
    if (state.currentStepIndex >= 0 && state.currentStepIndex < state.steps.length) {
      // 完成当前步骤
      state.steps[state.currentStepIndex].status = 'success';
    }

    // 移动到下一步
    state.currentStepIndex++;

    if (state.currentStepIndex < state.steps.length) {
      const step = state.steps[state.currentStepIndex];
      step.status = 'loading';
      state.message = message || step.title;

      // 计算基于步骤的进度
      const totalWeight = state.steps.reduce((sum, s) => sum + (s.weight || 1), 0);
      const completedWeight = state.steps
        .slice(0, state.currentStepIndex)
        .reduce((sum, s) => sum + (s.weight || 1), 0);

      const stepProgress = (completedWeight / totalWeight) * 100;
      updateProgress(stepProgress);
    }
  };

  // 设置步骤错误
  const setStepError = (error: string, stepIndex?: number) => {
    const targetIndex = stepIndex ?? state.currentStepIndex;
    if (targetIndex >= 0 && targetIndex < state.steps.length) {
      state.steps[targetIndex].status = 'error';
    }
    setError(error);
  };

  // 设置错误
  const setError = (error: string) => {
    state.loading = false;
    state.error = error;
    state.estimatedTimeRemaining = null;
  };

  // 完成加载
  const finishLoading = (message?: string) => {
    // 完成所有剩余步骤
    state.steps.forEach(step => {
      if (step.status === 'pending' || step.status === 'loading') {
        step.status = 'success';
      }
    });

    state.loading = false;
    state.progress = 100;
    state.error = null;
    state.estimatedTimeRemaining = null;
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
    state.startTime = null;
    state.steps = [];
    state.currentStepIndex = -1;
    state.estimatedTimeRemaining = null;
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
    duration,
    currentStep,
    completedSteps,
    formatTimeRemaining,
    startLoading,
    updateProgress,
    nextStep,
    setStepError,
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
