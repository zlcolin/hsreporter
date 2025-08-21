<template>
  <div class="progress-indicator" :class="progressClass">
    <!-- 主进度条 -->
    <div v-if="showProgress" class="progress-container">
      <el-progress
        :percentage="percentage"
        :status="progressStatus"
        :stroke-width="strokeWidth"
        :show-text="showText"
        :format="formatProgress"
        :color="progressColor"
      />
    </div>

    <!-- 步骤指示器 -->
    <div v-if="steps && steps.length > 0" class="steps-container">
      <div class="steps-list">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-item"
          :class="getStepClass(index)"
        >
          <div class="step-icon">
            <el-icon v-if="getStepStatus(index) === 'loading'" class="step-loading">
              <loading />
            </el-icon>
            <el-icon v-else-if="getStepStatus(index) === 'success'" class="step-success">
              <circle-check />
            </el-icon>
            <el-icon v-else-if="getStepStatus(index) === 'error'" class="step-error">
              <circle-close />
            </el-icon>
            <span v-else class="step-number">{{ index + 1 }}</span>
          </div>
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
            <div v-if="step.description" class="step-description">{{ step.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态消息 -->
    <div v-if="message" class="status-message" :class="messageClass">
      <el-icon v-if="status === 'loading'" class="message-icon loading">
        <loading />
      </el-icon>
      <el-icon v-else-if="status === 'success'" class="message-icon success">
        <circle-check />
      </el-icon>
      <el-icon v-else-if="status === 'error'" class="message-icon error">
        <circle-close />
      </el-icon>
      <el-icon v-else-if="status === 'warning'" class="message-icon warning">
        <warning />
      </el-icon>
      <span class="message-text">{{ message }}</span>
    </div>

    <!-- 操作按钮 -->
    <div v-if="showActions" class="actions-container">
      <el-button
        v-if="showRetry && (status === 'error' || status === 'warning')"
        type="primary"
        size="small"
        @click="$emit('retry')"
      >
        重试
      </el-button>
      <el-button v-if="showCancel && status === 'loading'" size="small" @click="$emit('cancel')">
        取消
      </el-button>
    </div>

    <!-- 自定义内容插槽 -->
    <div v-if="$slots.default" class="custom-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CircleCheck, CircleClose, Loading, Warning } from '@element-plus/icons-vue';
import { computed } from 'vue';

export interface ProgressStep {
  title: string;
  description?: string;
  status?: 'pending' | 'loading' | 'success' | 'error';
}

interface Props {
  percentage?: number;
  status?: 'loading' | 'success' | 'error' | 'warning' | 'info';
  message?: string;
  showProgress?: boolean;
  showText?: boolean;
  showActions?: boolean;
  showRetry?: boolean;
  showCancel?: boolean;
  strokeWidth?: number;
  steps?: ProgressStep[];
  currentStep?: number;
  progressColor?: string | string[];
}

const props = withDefaults(defineProps<Props>(), {
  percentage: 0,
  status: 'loading',
  message: '',
  showProgress: true,
  showText: true,
  showActions: true,
  showRetry: true,
  showCancel: true,
  strokeWidth: 6,
  currentStep: 0,
});

const emit = defineEmits<{
  retry: [];
  cancel: [];
}>();

const progressStatus = computed(() => {
  switch (props.status) {
    case 'success':
      return 'success';
    case 'error':
      return 'exception';
    case 'warning':
      return 'warning';
    default:
      return undefined;
  }
});

const progressClass = computed(() => ({
  [`progress-indicator--${props.status}`]: true,
  'has-steps': props.steps && props.steps.length > 0,
}));

const messageClass = computed(() => ({
  [`status-message--${props.status}`]: true,
}));

const formatProgress = (percentage: number) => {
  if (percentage === 100) {
    return '完成';
  }
  return `${percentage}%`;
};

const getStepStatus = (index: number): 'pending' | 'loading' | 'success' | 'error' => {
  if (!props.steps) return 'pending';

  const step = props.steps[index];
  if (step.status) return step.status;

  if (index < props.currentStep) return 'success';
  if (index === props.currentStep) return 'loading';
  return 'pending';
};

const getStepClass = (index: number) => ({
  'step-item--pending': getStepStatus(index) === 'pending',
  'step-item--loading': getStepStatus(index) === 'loading',
  'step-item--success': getStepStatus(index) === 'success',
  'step-item--error': getStepStatus(index) === 'error',
  'step-item--current': index === props.currentStep,
});
</script>

<style scoped>
.progress-indicator {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-light);
}

.progress-container {
  width: 100%;
}

.steps-container {
  width: 100%;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.step-item--pending {
  opacity: 0.6;
}

.step-item--loading {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
}

.step-item--success {
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-7);
}

.step-item--error {
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
}

.step-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--el-bg-color);
  border: 2px solid var(--el-border-color);
  flex-shrink: 0;
}

.step-number {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.step-loading {
  color: var(--el-color-primary);
  animation: rotating 2s linear infinite;
}

.step-success {
  color: var(--el-color-success);
}

.step-error {
  color: var(--el-color-danger);
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  line-height: 1.4;
}

.step-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  margin-top: 2px;
}

.status-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
}

.status-message--loading {
  background: var(--el-color-info-light-9);
  color: var(--el-color-info);
  border: 1px solid var(--el-color-info-light-7);
}

.status-message--success {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
  border: 1px solid var(--el-color-success-light-7);
}

.status-message--error {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  border: 1px solid var(--el-color-danger-light-7);
}

.status-message--warning {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  border: 1px solid var(--el-color-warning-light-7);
}

.message-icon.loading {
  animation: rotating 2s linear infinite;
}

.message-text {
  flex: 1;
}

.actions-container {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.custom-content {
  width: 100%;
}

/* 动画 */
@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-indicator {
    padding: 12px;
    gap: 12px;
  }

  .step-item {
    padding: 6px;
    gap: 10px;
  }

  .step-icon {
    width: 20px;
    height: 20px;
  }

  .step-title {
    font-size: 13px;
  }

  .step-description {
    font-size: 11px;
  }

  .status-message {
    padding: 10px;
    font-size: 13px;
  }
}

/* 紧凑模式 */
.progress-indicator.has-steps .progress-container {
  margin-bottom: 8px;
}

.progress-indicator.has-steps .steps-list {
  gap: 8px;
}
</style>
