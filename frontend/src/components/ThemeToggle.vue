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
import { computed } from 'vue';
import { Sunny, Moon, Monitor, Check } from '@element-plus/icons-vue';
import { useTheme, type Theme } from '@/composables/useTheme';

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

/* Mobile optimizations */
@media (max-width: 767px) {
  .theme-toggle-button {
    width: 44px;
    height: 44px;
  }

  :deep(.el-dropdown-menu__item) {
    padding: var(--spacing-md);
    font-size: var(--font-size-base);
    min-height: 44px;
  }
}
</style>
