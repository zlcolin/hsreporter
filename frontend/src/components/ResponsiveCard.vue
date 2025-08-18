<template>
  <el-card
    class="responsive-card"
    :class="cardClasses"
    :body-style="cardBodyStyle"
    :shadow="cardShadow"
    v-bind="$attrs"
  >
    <template #header v-if="$slots.header">
      <div class="responsive-card__header">
        <slot name="header" />
      </div>
    </template>

    <div class="responsive-card__body">
      <slot />
    </div>

    <template #footer v-if="$slots.footer">
      <div class="responsive-card__footer">
        <slot name="footer" />
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useBreakpoints } from '@/composables/useBreakpoints';

interface Props {
  padding?: 'none' | 'small' | 'medium' | 'large' | 'auto';
  shadow?: 'always' | 'hover' | 'never' | 'auto';
  bordered?: boolean;
  rounded?: boolean | 'small' | 'medium' | 'large';
  mobileOptimized?: boolean;
  fullHeight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'auto',
  shadow: 'auto',
  bordered: true,
  rounded: true,
  mobileOptimized: true,
  fullHeight: false,
});

const { isMobile, isTablet, isDesktop, currentBreakpoint } = useBreakpoints();

const cardClasses = computed(() => ({
  'responsive-card--mobile': isMobile.value,
  'responsive-card--tablet': isTablet.value,
  'responsive-card--desktop': isDesktop.value,
  'responsive-card--mobile-optimized': props.mobileOptimized,
  'responsive-card--full-height': props.fullHeight,
  'responsive-card--no-border': !props.bordered,
  [`responsive-card--rounded-${typeof props.rounded === 'string' ? props.rounded : 'medium'}`]:
    props.rounded,
  [`responsive-card--${currentBreakpoint.value}`]: true,
}));

const cardShadow = computed(() => {
  if (props.shadow === 'auto') {
    return isMobile.value ? 'always' : 'hover';
  }
  return props.shadow;
});

const cardBodyStyle = computed(() => {
  let padding: string;

  if (props.padding === 'auto') {
    if (isMobile.value) {
      padding = 'var(--spacing-lg)';
    } else if (isTablet.value) {
      padding = 'var(--spacing-xl)';
    } else {
      padding = 'var(--spacing-2xl)';
    }
  } else {
    const paddingMap = {
      none: '0',
      small: 'var(--spacing-md)',
      medium: 'var(--spacing-lg)',
      large: 'var(--spacing-xl)',
    };
    padding = paddingMap[props.padding] || 'var(--spacing-lg)';
  }

  return {
    padding,
    ...(props.fullHeight && { height: '100%' }),
  };
});
</script>

<style scoped>
.responsive-card {
  width: 100%;
  transition: all var(--duration-normal) ease;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
}

/* Mobile Optimizations */
.responsive-card--mobile {
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-lg);
}

.responsive-card--mobile :deep(.el-card__header) {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
}

.responsive-card--mobile :deep(.el-card__body) {
  padding: var(--spacing-lg);
}

.responsive-card--mobile-optimized {
  box-shadow: var(--shadow-md);
}

.responsive-card--mobile-optimized:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}

/* Tablet Optimizations */
.responsive-card--tablet {
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-xl);
}

.responsive-card--tablet :deep(.el-card__header) {
  padding: var(--spacing-xl);
}

.responsive-card--tablet :deep(.el-card__body) {
  padding: var(--spacing-xl);
}

/* Desktop Optimizations */
.responsive-card--desktop {
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-2xl);
}

.responsive-card--desktop :deep(.el-card__header) {
  padding: var(--spacing-2xl);
}

.responsive-card--desktop :deep(.el-card__body) {
  padding: var(--spacing-2xl);
}

.responsive-card--desktop:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Rounded Variations */
.responsive-card--rounded-small {
  border-radius: var(--border-radius-sm);
}

.responsive-card--rounded-medium {
  border-radius: var(--border-radius-md);
}

.responsive-card--rounded-large {
  border-radius: var(--border-radius-lg);
}

/* Full Height */
.responsive-card--full-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.responsive-card--full-height :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* No Border */
.responsive-card--no-border {
  border: none;
  box-shadow: var(--shadow-sm);
}

/* Header Styling */
.responsive-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.responsive-card__header h1,
.responsive-card__header h2,
.responsive-card__header h3,
.responsive-card__header h4,
.responsive-card__header h5,
.responsive-card__header h6 {
  margin: 0;
  color: var(--color-text-primary);
}

/* Body Styling */
.responsive-card__body {
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
}

/* Footer Styling */
.responsive-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-primary);
  margin-top: var(--spacing-lg);
}

/* Breakpoint-specific Styles */
.responsive-card--xs .responsive-card__header,
.responsive-card--xs .responsive-card__footer {
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-sm);
}

.responsive-card--xs .responsive-card__footer {
  justify-content: stretch;
}

.responsive-card--xs .responsive-card__footer > * {
  width: 100%;
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .responsive-card--desktop:hover {
    transform: none;
    box-shadow: var(--shadow-md);
  }

  .responsive-card {
    cursor: default;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .responsive-card {
    border: 2px solid var(--color-text-primary);
  }

  .responsive-card__header,
  .responsive-card__footer {
    border-color: var(--color-text-primary);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .responsive-card {
    transition: none;
  }

  .responsive-card--desktop:hover {
    transform: none;
  }

  .responsive-card--mobile-optimized:active {
    transform: none;
  }
}

/* Dark Mode Adjustments */
@media (prefers-color-scheme: dark) {
  .responsive-card--mobile-optimized {
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--color-border-primary);
  }
}
</style>
