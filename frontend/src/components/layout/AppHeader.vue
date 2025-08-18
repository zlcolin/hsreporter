<template>
  <header class="app-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="app-title">{{ title }}</h1>
        <div v-if="subtitle" class="app-subtitle">{{ subtitle }}</div>
      </div>

      <div class="header-right">
        <slot name="actions">
          <theme-toggle />
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import ThemeToggle from '../ThemeToggle.vue';

interface Props {
  title?: string;
  subtitle?: string;
}

withDefaults(defineProps<Props>(), {
  title: '问题反馈系统',
  subtitle: '',
});
</script>

<style scoped>
.app-header {
  padding: var(--spacing-md) 0;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-primary);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.header-left {
  flex: 1;
}

.app-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.app-subtitle {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* Mobile Styles */
@media (max-width: 767px) {
  .app-title {
    font-size: var(--font-size-lg);
  }

  .header-content {
    padding: 0 var(--spacing-sm);
  }
}

/* Extra Small Mobile */
@media (max-width: 479px) {
  .app-title {
    font-size: var(--font-size-base);
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .header-right {
    align-self: flex-end;
  }
}
</style>