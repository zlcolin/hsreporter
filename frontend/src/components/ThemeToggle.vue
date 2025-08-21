<template>
  <div class="theme-toggle">
    <el-dropdown trigger="click" placement="bottom-end" @command="handleThemeChange">
      <el-button :icon="themeIcon" circle :title="currentThemeTitle" class="theme-toggle-button" />

      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="theme in themes"
            :key="theme.value"
            :command="theme.value"
            :class="{ 'is-active': currentTheme === theme.value }"
          >
            <el-icon class="theme-icon">
              <component :is="theme.icon" />
            </el-icon>
            <span>{{ theme.label }}</span>
            <el-icon v-if="currentTheme === theme.value" class="check-icon">
              <check />
            </el-icon>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { useTheme, type Theme } from '@/composables/useTheme';
import { Check, Monitor, Moon, Sunny } from '@element-plus/icons-vue';
import { computed } from 'vue';

const { currentTheme, resolvedTheme, setTheme, getThemeDisplayName } = useTheme();

const themes = [
  {
    value: 'light' as Theme,
    label: '浅色主题',
    icon: Sunny,
  },
  {
    value: 'dark' as Theme,
    label: '深色主题',
    icon: Moon,
  },
  {
    value: 'auto' as Theme,
    label: '跟随系统',
    icon: Monitor,
  },
];

const themeIcon = computed(() => {
  if (currentTheme.value === 'auto') return Monitor;
  return resolvedTheme.value === 'dark' ? Moon : Sunny;
});

const currentThemeTitle = computed(() => {
  return `当前主题: ${getThemeDisplayName(currentTheme.value)}`;
});

const handleThemeChange = (theme: Theme) => {
  setTheme(theme);
};
</script>

<style scoped>
.theme-toggle {
  display: inline-block;
}

.theme-toggle-button {
  transition: all var(--duration-normal) ease;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.theme-toggle-button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.theme-toggle-button:focus {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  transition: all var(--duration-fast) ease;
}

:deep(.el-dropdown-menu__item.is-active) {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 500;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: var(--color-bg-tertiary);
}

.theme-icon {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.is-active .theme-icon {
  color: var(--color-primary);
}

.check-icon {
  margin-left: auto;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}

/* Enhanced Mobile optimizations */
@media (max-width: 767px) {
  .theme-toggle-button {
    width: var(--touch-target-size);
    height: var(--touch-target-size);
    border-radius: var(--border-radius-mobile);
    font-size: var(--font-size-lg);
    position: relative;
    overflow: hidden;
  }

  .theme-toggle-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    opacity: 0;
    transition: opacity var(--mobile-transition-fast) ease;
    pointer-events: none;
  }

  .theme-toggle-button:active {
    transform: scale(0.95);
    transition: transform var(--mobile-transition-fast) ease;
  }

  .theme-toggle-button:active::before {
    opacity: 1;
  }

  :deep(.el-dropdown-menu__item) {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-base);
    min-height: var(--touch-target-size);
    border-radius: var(--border-radius-mobile);
    margin: var(--spacing-xs);
    transition: all var(--mobile-transition-fast) ease;
    position: relative;
    overflow: hidden;
  }

  :deep(.el-dropdown-menu__item)::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-primary-light);
    opacity: 0;
    transition: opacity var(--mobile-transition-fast) ease;
    pointer-events: none;
  }

  :deep(.el-dropdown-menu__item):active::before {
    opacity: 1;
  }

  :deep(.el-dropdown-menu) {
    border-radius: var(--border-radius-mobile-lg);
    padding: var(--spacing-sm);
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--color-border-primary);
    background: var(--color-bg-modal);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

/* Enhanced dark theme support */
[data-theme='dark'] .theme-toggle-button {
  background: var(--color-bg-primary);
  border-color: var(--color-border-primary);
  color: var(--color-text-primary);
}

[data-theme='dark'] .theme-toggle-button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-bg-secondary);
}

/* Auto dark theme support */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .theme-toggle-button {
    background: var(--color-bg-primary);
    border-color: var(--color-border-primary);
    color: var(--color-text-primary);
  }

  :root:not([data-theme]) .theme-toggle-button:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-bg-secondary);
  }
}
</style>
