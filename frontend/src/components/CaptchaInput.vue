<template>
  <div class="captcha-container">
    <el-form-item label="验证码" prop="captcha" :error="captchaError">
      <div class="captcha-input-group">
        <el-input
          v-model="captchaCode"
          placeholder="请输入图片中的数字"
          inputmode="numeric"
          maxlength="4"
          :disabled="loading"
          @input="handleInput"
          @keyup.enter="handleVerify"
          class="captcha-input"
        >
          <template #suffix>
            <el-icon v-if="verifying" class="is-loading">
              <loading />
            </el-icon>
            <el-icon v-else-if="verified" class="success-icon">
              <check />
            </el-icon>
          </template>
        </el-input>

        <div class="captcha-image-container">
          <div
            v-if="loading"
            class="captcha-loading"
            v-loading="loading"
            element-loading-text="加载中..."
          >
            <div class="loading-placeholder"></div>
          </div>

          <img
            v-else-if="captchaImageUrl"
            :src="captchaImageUrl"
            alt="验证码"
            class="captcha-image"
            @click="refreshCaptcha"
            :title="refreshTooltip"
          />

          <div v-else class="captcha-error" @click="refreshCaptcha">
            <el-icon><refresh-right /></el-icon>
            <span>点击重新加载</span>
          </div>
        </div>

        <el-button
          type="primary"
          :icon="RefreshRight"
          :loading="loading"
          @click="refreshCaptcha"
          class="refresh-button"
          :title="refreshTooltip"
        >
          刷新
        </el-button>
      </div>

      <!-- 验证码状态提示 -->
      <div v-if="statusMessage" class="captcha-status" :class="statusClass">
        <el-icon>
          <info-filled v-if="statusType === 'info'" />
          <success-filled v-else-if="statusType === 'success'" />
          <warning-filled v-else-if="statusType === 'warning'" />
          <circle-close-filled v-else-if="statusType === 'error'" />
        </el-icon>
        <span>{{ statusMessage }}</span>
      </div>

      <!-- 过期倒计时 -->
      <div v-if="showCountdown && timeRemaining > 0" class="captcha-countdown">
        <el-icon><clock /></el-icon>
        <span>验证码将在 {{ formatTime(timeRemaining) }} 后过期</span>
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  RefreshRight,
  Loading,
  Check,
  InfoFilled,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
  Clock,
} from '@element-plus/icons-vue';
import { captchaApi } from '@/services/captchaApi';

interface Props {
  modelValue?: string;
  disabled?: boolean;
  autoRefresh?: boolean;
  showCountdown?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'verified', captchaId: string): void;
  (e: 'error', error: string): void;
  (e: 'refresh'): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  autoRefresh: true,
  showCountdown: true,
});

const emit = defineEmits<Emits>();

// 响应式数据
const captchaCode = ref(props.modelValue);
const captchaImageUrl = ref('');
const captchaId = ref('');
const loading = ref(false);
const verifying = ref(false);
const verified = ref(false);
const captchaError = ref('');
const statusMessage = ref('');
const statusType = ref<'info' | 'success' | 'warning' | 'error'>('info');
const expiresAt = ref(0);
const timeRemaining = ref(0);
const countdownTimer = ref<NodeJS.Timeout>();
const autoRefreshTimer = ref<NodeJS.Timeout>();

// 计算属性
const statusClass = computed(() => `captcha-status--${statusType.value}`);
const refreshTooltip = computed(() => (loading.value ? '加载中...' : '点击刷新验证码'));

// 监听输入值变化
watch(
  () => props.modelValue,
  newValue => {
    captchaCode.value = newValue;
  }
);

watch(captchaCode, newValue => {
  emit('update:modelValue', newValue);

  // 清除验证状态
  if (verified.value) {
    verified.value = false;
    statusMessage.value = '';
  }

  // 自动验证（当输入4位数字时）
  if (newValue.length === 4 && /^\d{4}$/.test(newValue)) {
    handleVerify();
  }
});

// 处理输入
const handleInput = (value: string) => {
  // 只允许数字输入
  const numericValue = value.replace(/\D/g, '');
  captchaCode.value = numericValue;
  captchaError.value = '';
};

// 生成验证码
const generateCaptcha = async () => {
  if (loading.value) return;

  try {
    loading.value = true;
    statusMessage.value = '';
    captchaError.value = '';

    const result = await captchaApi.generate();

    captchaImageUrl.value = result.imageUrl;
    captchaId.value = result.captchaId;
    expiresAt.value = Date.now() + result.expiresIn;

    // 启动倒计时
    startCountdown();

    // 设置自动刷新
    if (props.autoRefresh) {
      scheduleAutoRefresh(result.expiresIn);
    }

    setStatus('info', '请输入图片中的4位数字');
  } catch (error) {
    console.error('生成验证码失败:', error);
    captchaError.value = '验证码加载失败';
    setStatus('error', '验证码加载失败，请点击刷新重试');
    emit('error', '验证码加载失败');
  } finally {
    loading.value = false;
  }
};

// 刷新验证码
const refreshCaptcha = async () => {
  if (loading.value) return;

  try {
    loading.value = true;
    verified.value = false;
    captchaCode.value = '';
    statusMessage.value = '';
    captchaError.value = '';

    // 清除定时器
    clearTimers();

    const result = await captchaApi.refresh(captchaId.value);

    captchaImageUrl.value = result.imageUrl;
    captchaId.value = result.captchaId;
    expiresAt.value = Date.now() + result.expiresIn;

    // 启动倒计时
    startCountdown();

    // 设置自动刷新
    if (props.autoRefresh) {
      scheduleAutoRefresh(result.expiresIn);
    }

    setStatus('info', '验证码已刷新，请输入新的数字');
    emit('refresh');
  } catch (error) {
    console.error('刷新验证码失败:', error);
    captchaError.value = '验证码刷新失败';
    setStatus('error', '验证码刷新失败，请稍后重试');
    emit('error', '验证码刷新失败');
  } finally {
    loading.value = false;
  }
};

// 验证验证码
const handleVerify = async () => {
  if (!captchaCode.value || !captchaId.value || verifying.value) return;

  try {
    verifying.value = true;
    captchaError.value = '';

    const result = await captchaApi.verify(captchaId.value, captchaCode.value);

    if (result.success) {
      verified.value = true;
      setStatus('success', '验证码验证成功');
      emit('verified', captchaId.value);
      clearTimers();
    } else {
      setStatus('error', result.message);
      captchaError.value = result.message;
      emit('error', result.message);

      // 如果是需要重新获取验证码的错误，自动刷新
      if (
        result.error?.code === 'CAPTCHA_NOT_FOUND' ||
        result.error?.code === 'CAPTCHA_EXPIRED' ||
        result.error?.code === 'TOO_MANY_ATTEMPTS'
      ) {
        setTimeout(() => {
          refreshCaptcha();
        }, 1500);
      }
    }
  } catch (error) {
    console.error('验证验证码失败:', error);
    captchaError.value = '验证失败，请重试';
    setStatus('error', '验证失败，请重试');
    emit('error', '验证失败');
  } finally {
    verifying.value = false;
  }
};

// 设置状态消息
const setStatus = (type: typeof statusType.value, message: string) => {
  statusType.value = type;
  statusMessage.value = message;
};

// 启动倒计时
const startCountdown = () => {
  if (!props.showCountdown) return;

  clearInterval(countdownTimer.value);

  const updateCountdown = () => {
    const remaining = Math.max(0, expiresAt.value - Date.now());
    timeRemaining.value = remaining;

    if (remaining <= 0) {
      clearInterval(countdownTimer.value);
      if (!verified.value) {
        setStatus('warning', '验证码已过期，请刷新后重新输入');
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
      refreshCaptcha();
    }
  }, refreshDelay);
};

// 清除所有定时器
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

// 格式化时间
const formatTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`;
  }
  return `${remainingSeconds}秒`;
};

// 公开方法
const refresh = () => refreshCaptcha();
const verify = () => handleVerify();
const getCaptchaId = () => captchaId.value;
const isVerified = () => verified.value;

defineExpose({
  refresh,
  verify,
  getCaptchaId,
  isVerified,
});

// 生命周期
onMounted(() => {
  generateCaptcha();
});

onUnmounted(() => {
  clearTimers();
});
</script>

<style scoped>
.captcha-container {
  width: 100%;
}

.captcha-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.captcha-input {
  flex: 1;
  min-width: 120px;
}

.captcha-image-container {
  position: relative;
  width: 120px;
  height: 40px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--el-fill-color-light);
}

.captcha-image {
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: opacity 0.3s;
}

.captcha-image:hover {
  opacity: 0.8;
}

.captcha-loading,
.loading-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-light);
}

.captcha-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--el-color-danger);
  font-size: 12px;
  transition: color 0.3s;
}

.captcha-error:hover {
  color: var(--el-color-danger-light-3);
}

.refresh-button {
  flex-shrink: 0;
}

.captcha-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.captcha-status--info {
  color: var(--el-color-info);
  background-color: var(--el-color-info-light-9);
}

.captcha-status--success {
  color: var(--el-color-success);
  background-color: var(--el-color-success-light-9);
}

.captcha-status--warning {
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
}

.captcha-status--error {
  color: var(--el-color-danger);
  background-color: var(--el-color-danger-light-9);
}

.captcha-countdown {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.success-icon {
  color: var(--el-color-success);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .captcha-input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .captcha-image-container {
    width: 100%;
    max-width: 200px;
    align-self: center;
  }

  .refresh-button {
    align-self: center;
    width: 100px;
  }
}
</style>
