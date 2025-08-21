<template>
  <div class="responsive-layout" :class="layoutClasses">
    <!-- Header -->
    <header class="layout-header" v-if="$slots.header">
      <div class="container">
        <slot name="header" />
      </div>
    </header>

    <!-- Main Content -->
    <main class="layout-main">
      <div class="container" :class="containerClass">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="layout-footer" v-if="$slots.footer">
      <div class="container">
        <slot name="footer" />
      </div>
    </footer>

    <!-- Sidebar (for future use) -->
    <aside class="layout-sidebar" v-if="$slots.sidebar && showSidebar">
      <slot name="sidebar" />
    </aside>

    <!-- Mobile Menu Overlay -->
    <div class="mobile-overlay" v-if="showMobileOverlay" @click="closeMobileMenu" />
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@/composables/useBreakpoints';
import { computed, ref } from 'vue';

interface Props {
  containerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
  fluid?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  containerSize: 'lg',
  showSidebar: false,
  sidebarCollapsed: false,
  fluid: false,
});

const emit = defineEmits<{
  'sidebar-toggle': [];
  'mobile-menu-close': [];
}>();

const { isMobile, isTablet, isDesktop, currentBreakpoint } = useBreakpoints();

const showMobileOverlay = ref(false);

const layoutClasses = computed(() => ({
  'is-mobile': isMobile.value,
  'is-tablet': isTablet.value,
  'is-desktop': isDesktop.value,
  'has-sidebar': props.showSidebar,
  'sidebar-collapsed': props.sidebarCollapsed,
  'is-fluid': props.fluid,
  [`breakpoint-${currentBreakpoint.value}`]: true,
}));

const containerClass = computed(() => {
  if (props.fluid) return 'container-fluid';
  return `container-${props.containerSize}`;
});

const closeMobileMenu = () => {
  showMobileOverlay.value = false;
  emit('mobile-menu-close');
};

const toggleSidebar = () => {
  emit('sidebar-toggle');
};

// Expose methods for parent components
defineExpose({
  toggleSidebar,
  closeMobileMenu,
});
</script>

<style scoped>
.responsive-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
}

.layout-header {
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.layout-main {
  flex: 1;
  padding: var(--spacing-lg) 0;
}

.layout-footer {
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-primary);
  padding: var(--spacing-lg) 0;
  margin-top: auto;
}

.layout-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: var(--color-bg-primary);
  border-right: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-fixed);
  transform: translateX(-100%);
  transition: transform var(--duration-normal) ease;
}

.has-sidebar .layout-sidebar {
  transform: translateX(0);
}

.has-sidebar .layout-main {
  margin-left: 280px;
  transition: margin-left var(--duration-normal) ease;
}

.sidebar-collapsed .layout-sidebar {
  width: 80px;
}

.sidebar-collapsed .layout-main {
  margin-left: 80px;
}

.container-fluid {
  width: 100%;
  padding: 0 var(--spacing-md);
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  opacity: 0;
  animation: fadeIn var(--duration-normal) ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* Enhanced Mobile Styles */
.is-mobile .layout-main {
  padding: var(--mobile-form-spacing) 0;
  min-height: calc(100vh - var(--mobile-header-height));
}

.is-mobile .layout-header,
.is-mobile .layout-footer {
  padding: var(--spacing-md) 0;
}

.is-mobile .layout-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.is-mobile .layout-sidebar {
  width: 100%;
  transform: translateX(-100%);
  transition: transform var(--mobile-transition-normal) ease;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.is-mobile.has-sidebar .layout-main {
  margin-left: 0;
}

.is-mobile.has-sidebar .layout-sidebar {
  transform: translateX(0);
}

/* Enhanced mobile keyboard handling */
.is-mobile.keyboard-open .layout-main {
  height: calc(100vh - var(--keyboard-height, 0px) - var(--mobile-header-height));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Enhanced mobile safe area support */
@supports (padding: max(0px)) {
  .is-mobile .layout-header {
    padding-top: max(var(--spacing-md), env(safe-area-inset-top));
  }

  .is-mobile .layout-main {
    padding-left: max(var(--mobile-form-spacing), env(safe-area-inset-left));
    padding-right: max(var(--mobile-form-spacing), env(safe-area-inset-right));
  }

  .is-mobile .layout-footer {
    padding-bottom: max(var(--spacing-md), env(safe-area-inset-bottom));
  }
}

/* Tablet Styles */
.is-tablet .layout-sidebar {
  width: 240px;
}

.is-tablet.has-sidebar .layout-main {
  margin-left: 240px;
}

.is-tablet.sidebar-collapsed .layout-sidebar {
  width: 60px;
}

.is-tablet.sidebar-collapsed .layout-main {
  margin-left: 60px;
}

/* Desktop Styles */
.is-desktop .layout-main {
  padding: var(--spacing-xl) 0;
}

/* Responsive Container Sizes */
@media (min-width: 480px) {
  .container-xs {
    max-width: 100%;
  }
}

@media (min-width: 768px) {
  .container-sm {
    max-width: 540px;
  }

  .container-xs {
    max-width: 540px;
  }
}

@media (min-width: 1024px) {
  .container-md {
    max-width: 720px;
  }

  .container-sm {
    max-width: 720px;
  }

  .container-xs {
    max-width: 720px;
  }
}

@media (min-width: 1200px) {
  .container-lg {
    max-width: 960px;
  }

  .container-md {
    max-width: 960px;
  }

  .container-sm {
    max-width: 960px;
  }

  .container-xs {
    max-width: 960px;
  }
}

@media (min-width: 1440px) {
  .container-xl {
    max-width: 1140px;
  }

  .container-lg {
    max-width: 1140px;
  }

  .container-md {
    max-width: 1140px;
  }

  .container-sm {
    max-width: 1140px;
  }

  .container-xs {
    max-width: 1140px;
  }
}

/* Print Styles */
@media print {
  .layout-header,
  .layout-footer,
  .layout-sidebar {
    display: none;
  }

  .layout-main {
    margin: 0;
    padding: 0;
  }
}
</style>
