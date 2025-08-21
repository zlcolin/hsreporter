<template>
  <el-button
    :type="type"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    :icon="icon"
    :class="[
      'base-button',
      `base-button--${variant}`,
      {
        'base-button--block': block,
        'base-button--rounded': rounded,
      },
    ]"
    @click="handleClick"
  >
    <slot />
  </el-button>
</template>

<script setup lang="ts">
import type { ButtonSize, ButtonType } from 'element-plus';

interface Props {
  type?: ButtonType;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  variant?: 'default' | 'gradient' | 'outline' | 'text';
  block?: boolean;
  rounded?: boolean;
}

interface Emits {
  click: [event: MouseEvent];
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'default',
  disabled: false,
  loading: false,
  variant: 'default',
  block: false,
  rounded: false,
});

const emit = defineEmits<Emits>();

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
.base-button {
  transition: all 0.3s ease;
  font-weight: 500;
}

.base-button--gradient.el-button--primary {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border: none;
}

.base-button--gradient.el-button--primary:hover {
  background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.base-button--outline {
  background: transparent;
  border: 2px solid var(--el-color-primary);
  color: var(--el-color-primary);
}

.base-button--outline:hover {
  background: var(--el-color-primary);
  color: white;
}

.base-button--block {
  width: 100%;
}

.base-button--rounded {
  border-radius: 24px;
}

.base-button:active {
  transform: translateY(1px);
}

.base-button:disabled {
  transform: none;
  opacity: 0.6;
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .base-button {
    min-height: 44px;
    font-size: 16px;
  }

  .base-button--block {
    border-radius: 12px;
  }
}
</style>
