<template>
  <div class="mobile-form-layout" :class="layoutClasses">
    <!-- Header Section -->
    <div class="mobile-form-header" v-if="$slots.header">
      <slot name="header" />
    </div>

    <!-- Form Content -->
    <div class="mobile-form-content" :class="contentClasses">
      <slot />
    </div>

    <!-- Sticky Actions -->
    <div class="mobile-form-actions" v-if="$slots.actions" :class="actionsClasses">
      <slot name="actions" />
    </div>

    <!-- Safe Area Bottom Padding -->
    <div class="mobile-safe-area-bottom" v-if="addSafeArea" />
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@/composables/useBreakpoints';
import { computed } from 'vue';

interface Props {
  stickyActions?: boolean;
  addSafeArea?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  background?: 'primary' | 'secondary' | 'transparent';
  fullHeight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  stickyActions: true,
  addSafeArea: true,
  padding: 'medium',
  background: 'secondary',
  fullHeight: false,
});

const { isMobile, isTablet } = useBreakpoints();

const layoutClasses = computed(() => ({
  'mobile-form-layout--mobile': isMobile.value,
  'mobile-form-layout--tablet': isTablet.value,
  'mobile-form-layout--full-height': props.fullHeight,
  [`mobile-form-layout--bg-${props.background}`]: true,
}));

const contentClasses = computed(() => ({
  'mobile-form-content--sticky-actions': props.stickyActions,
  [`mobile-form-content--padding-${props.padding}`]: true,
}));

const actionsClasses = computed(() => ({
  'mobile-form-actions--sticky': props.stickyActions,
}));
</script>

<style scoped>
.mobile-form-layout {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--color-bg-secondary);
}

.mobile-form-layout--bg-primary {
  background: var(--color-bg-primary);
}

.mobile-form-layout--bg-secondary {
  background: var(--color-bg-secondary);
}

.mobile-form-layout--bg-transparent {
  background: transparent;
}

.mobile-form-layout--full-height {
  height: 100vh;
}

/* Header */
.mobile-form-header {
  flex-shrink: 0;
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sm);
}

/* Content */
.mobile-form-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-form-content--padding-none {
  padding: 0;
}

.mobile-form-content--padding-small {
  padding: var(--spacing-md);
}

.mobile-form-content--padding-medium {
  padding: var(--spacing-lg);
}

.mobile-form-content--padding-large {
  padding: var(--spacing-xl);
}

.mobile-form-content--sticky-actions {
  padding-bottom: calc(var(--mobile-button-height) * 2 + var(--spacing-xl) * 2);
}

/* Actions */
.mobile-form-actions {
  flex-shrink: 0;
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-primary);
}

.mobile-form-actions--sticky {
  position: sticky;
  bottom: 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  z-index: var(--z-sticky);
}

/* Safe Area */
.mobile-safe-area-bottom {
  height: env(safe-area-inset-bottom);
  background: var(--color-bg-primary);
}

/* Mobile Specific */
@media (max-width: 767px) {
  .mobile-form-layout--mobile .mobile-form-header {
    padding: var(--spacing-md);
  }

  .mobile-form-layout--mobile .mobile-form-content--padding-medium {
    padding: var(--mobile-form-spacing);
  }

  .mobile-form-layout--mobile .mobile-form-actions {
    padding: var(--spacing-md);
  }

  .mobile-form-layout--mobile .mobile-form-actions--sticky {
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
  }
}

/* Tablet Specific */
@media (min-width: 768px) and (max-width: 1023px) {
  .mobile-form-layout--tablet .mobile-form-content {
    max-width: 600px;
    margin: 0 auto;
  }
}

/* Dark Theme */
[data-theme='dark'] .mobile-form-header,
[data-theme='dark'] .mobile-form-actions {
  background: var(--color-bg-primary);
  border-color: var(--color-border-primary);
}

[data-theme='dark'] .mobile-form-actions--sticky {
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
}

/* Auto Dark Theme */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .mobile-form-header,
  :root:not([data-theme]) .mobile-form-actions {
    background: var(--color-bg-primary);
    border-color: var(--color-border-primary);
  }

  :root:not([data-theme]) .mobile-form-actions--sticky {
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
  }
}

/* Landscape Orientation */
@media (max-width: 1023px) and (orientation: landscape) {
  .mobile-form-header {
    padding: var(--spacing-sm) var(--spacing-lg);
  }

  .mobile-form-content--sticky-actions {
    padding-bottom: calc(var(--mobile-button-height) + var(--spacing-lg) * 2);
  }

  .mobile-form-actions {
    padding: var(--spacing-sm) var(--spacing-lg);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .mobile-form-content {
    scroll-behavior: auto;
  }
}
</style>
