import { ref, computed, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { captchaApi } from '@/services/captchaApi';

export interface UseCaptchaOptions {
  autoRefresh?: boolean;
  showCountdown?: boolean;
  onVerified?: (captchaId: string) => void;
  onError?: (error: string) => void;
}

export function useCaptcha(options: UseCaptchaOptions = {}) {
  const { autoRefresh = true, showCountdown = true, onVerified, onError } = options;

  // 响应式状态
  const captchaCode = ref('');
  const captchaImageUrl = ref('');
  const captchaId = ref('');
  const loading = ref(false);
  const verifying = ref(false);
  const verified = ref(false);
  const error = ref('');
  const expiresAt = ref(0);
  const timeRemaining = ref(0);

  // 定时器
  const countdownTimer = ref<NodeJS.Timeout>();
  const autoRefreshTimer = ref<NodeJS.Timeout>();

  // 计算属性
  const isExpired = computed(() => timeRemaining.value <= 0);
  const canVerify = computed(
    () =>
      captchaCode.value.length === 4 &&
      /^\d{4}$/.test(captchaCode.value) &&
      captchaId.value &&
      !verifying.value &&
      !isExpired.value
  );

  // 生成验证码
  const generate = async () => {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = '';
      verified.value = false;
      captchaCode.value = '';

      const result = await captchaApi.generate();

      captchaImageUrl.value = result.imageUrl;
      captchaId.value = result.captchaId;
      expiresAt.value = Date.now() + result.expiresIn;

      // 启动倒计时
      if (showCountdown) {
        startCountdown();
      }

      // 设置自动刷新
      if (autoRefresh) {
        scheduleAutoRefresh(result.expiresIn);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成验证码失败';
      error.value = errorMessage;
      ElMessage.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      loading.value = false;
    }
  };

  // 刷新验证码
  const refresh = async () => {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = '';
      verified.value = false;
      captchaCode.value = '';

      clearTimers();

      const result = await captchaApi.refresh(captchaId.value);

      captchaImageUrl.value = result.imageUrl;
      captchaId.value = result.captchaId;
      expiresAt.value = Date.now() + result.expiresIn;

      // 启动倒计时
      if (showCountdown) {
        startCountdown();
      }

      // 设置自动刷新
      if (autoRefresh) {
        scheduleAutoRefresh(result.expiresIn);
      }

      ElMessage.success('验证码已刷新');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新验证码失败';
      error.value = errorMessage;
      ElMessage.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      loading.value = false;
    }
  };

  // 验证验证码
  const verify = async () => {
    if (!canVerify.value) return false;

    try {
      verifying.value = true;
      error.value = '';

      const result = await captchaApi.verify(captchaId.value, captchaCode.value);

      if (result.success) {
        verified.value = true;
        clearTimers();
        ElMessage.success('验证码验证成功');
        onVerified?.(captchaId.value);
        return true;
      } else {
        error.value = result.message;
        ElMessage.error(result.message);
        onError?.(result.message);

        // 如果需要重新获取验证码，自动刷新
        if (
          result.error?.code === 'CAPTCHA_NOT_FOUND' ||
          result.error?.code === 'CAPTCHA_EXPIRED' ||
          result.error?.code === 'TOO_MANY_ATTEMPTS'
        ) {
          setTimeout(() => {
            refresh();
          }, 1500);
        }

        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '验证失败';
      error.value = errorMessage;
      ElMessage.error(errorMessage);
      onError?.(errorMessage);
      return false;
    } finally {
      verifying.value = false;
    }
  };

  // 重置状态
  const reset = () => {
    captchaCode.value = '';
    captchaImageUrl.value = '';
    captchaId.value = '';
    loading.value = false;
    verifying.value = false;
    verified.value = false;
    error.value = '';
    expiresAt.value = 0;
    timeRemaining.value = 0;
    clearTimers();
  };

  // 启动倒计时
  const startCountdown = () => {
    clearInterval(countdownTimer.value);

    const updateCountdown = () => {
      const remaining = Math.max(0, expiresAt.value - Date.now());
      timeRemaining.value = remaining;

      if (remaining <= 0) {
        clearInterval(countdownTimer.value);
        if (!verified.value) {
          error.value = '验证码已过期，请刷新后重新输入';
        }
      }
    };

    updateCountdown();
    countdownTimer.value = setInterval(updateCountdown, 1000);
  };

  // 安排自动刷新
  const scheduleAutoRefresh = (expiresIn: number) => {
    clearTimeout(autoRefreshTimer.value);

    // 在过期前30秒自动刷新
    const refreshDelay = Math.max(1000, expiresIn - 30000);

    autoRefreshTimer.value = setTimeout(() => {
      if (!verified.value && !loading.value) {
        refresh();
      }
    }, refreshDelay);
  };

  // 清除定时器
  const clearTimers = () => {
    if (countdownTimer.value) {
      clearInterval(countdownTimer.value);
      countdownTimer.value = undefined;
    }
    if (autoRefreshTimer.value) {
      clearTimeout(autoRefreshTimer.value);
      autoRefreshTimer.value = undefined;
    }
  };

  // 格式化剩余时间
  const formatTimeRemaining = () => {
    const seconds = Math.ceil(timeRemaining.value / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    }
    return `${remainingSeconds}秒`;
  };

  // 清理资源
  onUnmounted(() => {
    clearTimers();
  });

  return {
    // 状态
    captchaCode,
    captchaImageUrl,
    captchaId,
    loading,
    verifying,
    verified,
    error,
    timeRemaining,

    // 计算属性
    isExpired,
    canVerify,

    // 方法
    generate,
    refresh,
    verify,
    reset,
    formatTimeRemaining,

    // 工具方法
    validateFormat: captchaApi.validateCaptchaFormat,
    validateIdFormat: captchaApi.validateCaptchaIdFormat,
  };
}
