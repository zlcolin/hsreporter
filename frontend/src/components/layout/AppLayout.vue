<template>
  <div class="app-layout" :class="{ 'app-layout--mobile': isMobile }">
    <app-header :title="title" :subtitle="subtitle">
      <template #actions>
        <slot name="header-actions">
          <theme-toggle />
        </slot>
      </template>
    </app-header>

    <main class="app-main">
      <div class="main-content">
        <slot />
      </div>
    </main>

    <app-footer :version="version">
      <template #links>
        <slot name="footer-links" />
      </template>
    </app-footer>
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@/composables/useBreakpoints';
import ThemeToggle from '../ThemeToggle.vue';
import AppFooter from './AppFooter.vue';
import AppHeader from './AppHeader.vue';

interface Props {
  title?: string;
  subtitle?: string;
  version?: string;
}

withDefaults(defineProps<Props>(), {
  title: '问题反馈系统',
  subtitle: '',
  version: '1.0.0',
});

const { isMobile } = useBreakpoints();
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg) 0;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  width: 100%;
}

/* Mobile Styles */
.app-layout--mobile .app-main {
  padding: var(--spacing-md) 0;
}

.app-layout--mobile .main-content {
  padding: 0 var(--spacing-sm);
}

/* Animation */
.app-layout {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Safe Area Support */
@supports (padding: max(0px)) {
  .main-content {
    padding-left: max(var(--spacing-md), env(safe-area-inset-left));
    padding-right: max(var(--spacing-md), env(safe-area-inset-right));
  }

  .app-layout--mobile .main-content {
    padding-left: max(var(--spacing-sm), env(safe-area-inset-left));
    padding-right: max(var(--spacing-sm), env(safe-area-inset-right));
  }
}
</style>
