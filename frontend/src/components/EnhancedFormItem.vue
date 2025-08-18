<template>
  <el-form-item :label="label" :prop="prop" :class="formItemClass" :required="required">
    <div class="form-item-wrapper">
      <!-- 输入框容器 -->
      <div class="input-wrapper" :class="{ 'has-error': hasError, 'is-validating': isValidating }">
        <slot />

        <!-- 验证状态图标 -->
        <div class="validation-icon" v-if="showValidationIcon">
          <el-icon v-if="isValidating" class="is-loading">
            <loading />
          </el-icon>
          <el-icon v-else-if="hasError" class="is-error">
            <circle-close />
          </el-icon>
          <el-icon v-else-if="isValid && touched" class="is-success">
            <circle-check />
          </el-icon>
        </div>
      </div>

      <!-- 实时错误提示 -->
      <transition name="error-fade">
        <div v-if="hasError && showError" class="error-message">
          <el-icon><warning /></el-icon>
          <span>{{ errorMessage }}</span>
        </div>
      </transition>

      <!-- 帮助文本 -->
      <div v-if="helpText && !hasError" class="help-text">
        {{ helpText }}
      </div>

      <!-- 字符计数 -->
      <div
        v-if="showCharCount && maxLength"
        class="char-count"
        :class="{ 'over-limit': isOverLimit }"
      >
        {{ currentLength }}/{{ maxLength }}
      </div>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { Loading, CircleClose, CircleCheck, Warning } from '@element-plus/icons-vue';

interface Props {
  label: string;
  prop: string;
  required?: boolean;
  helpText?: string;
  showValidationIcon?: boolean;
  showError?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  currentLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  showValidationIcon: true,
  showError: true,
  showCharCount: false,
  currentLength: 0,
});

// 从父组件注入验证状态
const validationState = inject('validationState', null);
const isValidating = inject('isValidating', false);

const hasError = computed(() => {
  if (!validationState) return false;
  return validationState.errors.some((error: any) => error.field === props.prop);
});

const errorMessage = computed(() => {
  if (!validationState) return '';
  const error = validationState.errors.find((error: any) => error.field === props.prop);
  return error?.message || '';
});

const touched = computed(() => {
  if (!validationState) return false;
  return validationState.touched[props.prop] || false;
});

const isValid = computed(() => {
  return touched.value && !hasError.value;
});

const isOverLimit = computed(() => {
  return props.maxLength && props.currentLength > props.maxLength;
});

const formItemClass = computed(() => {
  return {
    'enhanced-form-item': true,
    'has-error': hasError.value,
    'is-validating': isValidating,
    'is-valid': isValid.value,
    'is-required': props.required,
  };
});
</script>

<style scoped>
.enhanced-form-item {
  margin-bottom: 24px;
}

.form-item-wrapper {
  position: relative;
}

.input-wrapper {
  position: relative;
  transition: all 0.3s ease;
}

.input-wrapper.has-error :deep(.el-input__wrapper) {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

.input-wrapper.is-validating :deep(.el-input__wrapper) {
  border-color: var(--el-color-primary);
}

.validation-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  pointer-events: none;
}

.validation-icon .is-loading {
  color: var(--el-color-primary);
  animation: rotating 2s linear infinite;
}

.validation-icon .is-error {
  color: var(--el-color-danger);
}

.validation-icon .is-success {
  color: var(--el-color-success);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-danger);
  line-height: 1.4;
}

.help-text {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.char-count {
  position: absolute;
  right: 8px;
  bottom: -20px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: color 0.3s ease;
}

.char-count.over-limit {
  color: var(--el-color-danger);
}

/* 错误提示动画 */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.3s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 旋转动画 */
@keyframes rotating {
  0% {
    transform: translateY(-50%) rotate(0deg);
  }
  100% {
    transform: translateY(-50%) rotate(360deg);
  }
}

/* 必填字段样式 */
.is-required :deep(.el-form-item__label::before) {
  content: '*';
  color: var(--el-color-danger);
  margin-right: 4px;
}

/* 响应式设计 */
@media (max-width: 767px) {
  .enhanced-form-item {
    margin-bottom: var(--spacing-lg);
  }

  .validation-icon {
    right: var(--spacing-md);
  }

  .char-count {
    right: var(--spacing-md);
    bottom: -18px;
    font-size: var(--font-size-xs);
  }

  .error-message {
    font-size: var(--font-size-sm);
  }

  .help-text {
    font-size: var(--font-size-sm);
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .input-wrapper :deep(.el-input__wrapper) {
    min-height: 48px;
  }

  .input-wrapper :deep(.el-textarea__inner) {
    min-height: 120px;
    font-size: var(--font-size-base);
  }
}
</style>
