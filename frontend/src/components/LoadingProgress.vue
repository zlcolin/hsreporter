<template>
  <div class="loading-progress" :class="{ 'is-loading': isLoading, 'has-error': hasError }">
    <!-- 进度条 -->
    <div v-if="showProgress && isLoading" class="progress-container">
      <el-progress
        :percentage="progress"
        :status="hasError ? 'exception' : undefined"
        :stroke-width="strokeWidth"
        :show-text="showText"
        :format="formatProgress"
      />
    </div>

    <!-- 加载状态指示器 -->
    <div v-if="isLoading" class="loading-indicator">
      <el-icon class="loading-icon" :size="iconSize">
        <loading />
      </el-icon>
      <span class="loading-text">{{ message }}</span>
    </div>

    <!-- 错误状态 -->
    <div v-if="hasError" class="error-indicator">
      <el-icon class="error-icon" :size="iconSize">
        <circle-close />
      </el-icon>
      <span class="error-text">{{ error }}</span>
      <el-button v-if="showRetry" type="text" size="small" @click="$emit('retry')">
        重试
      </el-button>
    </div>

    <!-- 成功状态 -->
    <div v-if="isComplete && !hasError" class="success-indicator">
      <el-icon class="success-icon" :size="iconSize">
        <circle-check />
      </el-icon>
      <span class="success-text">{{ successMessage || '操作完成' }}</span>
    </div>

    <!-- 自定义内容插槽 -->
    <div v-if="$slots.default" class="custom-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Loading, CircleClose, CircleCheck } from '@element-plus/icons-vue';

interface Props {
  loading?: boolean;
  progress?: number;
  message?: string;
  error?: string | null;
  successMessage?: string;
  showProgress?: boolean;
  showText?: boolean;
  showRetry?: boolean;
  strokeWidth?: number;
  iconSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  progress: 0,
  message: '加载中...',
  error: null,
  successMessage: '',
  showProgress: true,
  showText: true,
  showRetry: true,
  strokeWidth: 6,
  iconSize: 16,
});

const emit = defineEmits<{
  retry: [];
}>();

const isLoading = computed(() => props.loading);
const hasError = computed(() => props.error !== null);
const isComplete = computed(() => props.progress >= 100 && !props.loading);

const formatProgress = (percentage: number) => {
  if (percentage === 100) {
    return '完成';
  }
  return `${percentage}%`;
};
</script>

<style scoped>
.loading-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.progress-container {
  width: 100%;
  max-width: 300px;
}

.loading-indicator,
.error-indicator,
.success-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.loading-icon {
  color: var(--el-color-primary);
  animation: rotating 2s linear infinite;
}

.error-icon {
  color: var(--el-color-danger);
}

.success-icon {
  color: var(--el-color-success);
}

.loading-text {
  color: var(--el-text-color-regular);
}

.error-text {
  color: var(--el-color-danger);
}

.success-text {
  color: var(--el-color-success);
}

.custom-content {
  width: 100%;
  text-align: center;
}

/* 状态变化动画 */
.loading-progress.is-loading {
  opacity: 1;
}

.loading-progress.has-error {
  background-color: var(--el-color-danger-light-9);
  border-radius: 4px;
}

/* 旋转动画 */
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
  .loading-progress {
    padding: 12px;
    gap: 10px;
  }

  .loading-indicator,
  .error-indicator,
  .success-indicator {
    font-size: 13px;
    gap: 6px;
  }
}
</style>
