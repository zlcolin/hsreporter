<template>
  <responsive-layout container-size="lg">
    <template #header>
      <div class="app-header">
        <div class="header-content">
          <h1 class="app-title">问题反馈系统</h1>
          <div class="header-actions">
            <theme-toggle />
          </div>
        </div>
      </div>
    </template>

    <div class="app-container">
      <responsive-card
        class="form-card"
        :mobile-optimized="true"
        :full-height="false"
        shadow="auto"
        rounded="large"
      >
        <template #header>
          <div class="card-header">
            <h2 class="card-title">提交反馈</h2>
            <div class="form-progress" v-if="formProgress > 0">
              <el-progress
                :percentage="formProgress"
                :stroke-width="isMobile ? 3 : 4"
                :show-text="false"
                status="success"
              />
              <span class="progress-text">完成度: {{ formProgress }}%</span>
            </div>
          </div>
        </template>

        <!-- Main Feedback Form -->
        <feedback-form />
      </responsive-card>

      <!-- 通知中心 -->
      <notification-center ref="notificationCenter" />
    </div>
  </responsive-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

// 组件导入
import NotificationCenter from './components/NotificationCenter.vue';
import ResponsiveCard from './components/ResponsiveCard.vue';
import ResponsiveLayout from './components/ResponsiveLayout.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import FeedbackForm from './components/form/FeedbackForm.vue';

// Composables and Stores
import { useBreakpoints } from './composables/useBreakpoints';
import { useStores } from './composables/useStores';

// Store instances
const { feedbackStore, appStore, userStore } = useStores();

// 响应式断点
const { isMobile, isTablet, isDesktop } = useBreakpoints();

// Reactive data
const notificationCenter = ref();

// 计算属性
const formProgress = computed(() => feedbackStore.formProgress);

// 监听断点变化并更新 store
watch(
  [isMobile, isTablet, isDesktop],
  ([mobile, tablet, desktop]) => {
    appStore.updateBreakpoints(mobile, tablet, desktop);
  },
  { immediate: true }
);

// 组件挂载时初始化
onMounted(() => {
  // 初始化应用状态
  appStore.initializeApp();

  // 初始化用户状态
  userStore.initializeUser();

  // 加载提交历史
  feedbackStore.loadSubmissionHistory();
});
</script>

<style scoped>
/* App Header */
.app-header {
  padding: var(--spacing-md) 0;
  background: var(--color-bg-primary);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.app-title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* Main Container */
.app-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0;
}

.form-card {
  box-shadow: var(--shadow-lg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border-primary);
  background: var(--color-bg-primary);
}

.card-header {
  text-align: center;
  position: relative;
  padding: var(--spacing-lg);
}

.card-title {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: var(--font-size-2xl);
}

.form-progress {
  margin-top: var(--spacing-md);
}

.progress-text {
  display: block;
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* 全局样式 */
:deep(#app) {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  min-height: 100vh;
}

/* Enhanced Mobile Styles */
@media (max-width: 767px) {
  .app-title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    line-height: var(--line-height-tight);
  }

  .header-content {
    flex-direction: row;
    justify-content: space-between;
    padding: 0 var(--mobile-form-spacing);
    align-items: center;
    min-height: var(--mobile-header-height);
  }

  .card-header {
    padding: var(--mobile-form-spacing);
    text-align: center;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border-primary);
  }

  .card-title {
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-md);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .form-card {
    margin: var(--mobile-card-margin);
    border-radius: var(--border-radius-mobile-lg);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--color-border-primary);
    background: var(--color-bg-primary);
    overflow: hidden;
  }

  .app-container {
    padding: 0;
    min-height: calc(100vh - var(--mobile-header-height));
  }

  .form-progress {
    margin-top: var(--spacing-lg);
  }

  .progress-text {
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-sm);
    color: var(--color-text-secondary);
  }
}

/* Extra Small Mobile */
@media (max-width: 479px) {
  .header-content {
    padding: 0 var(--spacing-sm);
    gap: var(--spacing-sm);
  }

  .app-title {
    font-size: var(--font-size-base);
    font-weight: 700;
  }

  .card-title {
    font-size: var(--font-size-lg);
  }

  .form-card {
    margin: var(--spacing-sm);
    border-radius: var(--border-radius-mobile);
  }

  .card-header {
    padding: var(--spacing-md);
  }
}

/* Tablet Styles */
@media (min-width: 768px) and (max-width: 1023px) {
  .app-container {
    padding: 0 var(--spacing-md);
  }
}

/* Desktop Styles */
@media (min-width: 1024px) {
  .form-card {
    box-shadow: var(--shadow-xl);
  }
}

/* Animation Effects */
.app-container {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Progress Bar Styling */
.form-progress :deep(.el-progress-bar__outer) {
  background-color: var(--color-bg-accent);
  border-radius: var(--border-radius-lg);
}

.form-progress :deep(.el-progress-bar__inner) {
  border-radius: var(--border-radius-lg);
  transition: width 0.6s ease;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
}

/* Enhanced Safe Area Support for iOS */
@supports (padding: max(0px)) {
  .app-header {
    padding-top: max(var(--spacing-md), env(safe-area-inset-top));
  }

  .app-container {
    padding-left: max(var(--spacing-md), env(safe-area-inset-left));
    padding-right: max(var(--spacing-md), env(safe-area-inset-right));
    padding-bottom: max(var(--spacing-lg), env(safe-area-inset-bottom));
  }

  .form-card {
    margin-left: max(var(--spacing-md), env(safe-area-inset-left));
    margin-right: max(var(--spacing-md), env(safe-area-inset-right));
  }
}

/* Landscape Orientation Optimizations */
@media (max-width: 1023px) and (orientation: landscape) {
  .app-header {
    padding: var(--spacing-sm) 0;
  }

  .card-header {
    padding: var(--spacing-md);
  }

  .card-title {
    font-size: var(--font-size-lg);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .app-container {
    animation: none;
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .form-card {
    border: 2px solid var(--color-text-primary);
  }

  .app-title {
    color: var(--color-text-primary);
    font-weight: 700;
  }
}

/* Dark Theme Enhancements */
[data-theme='dark'] .app-header {
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-primary);
}

[data-theme='dark'] .form-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-lg);
}

[data-theme='dark'] .card-header {
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-primary);
}

/* Enhanced Mobile Keyboard Handling */
@media (max-width: 767px) {
  .keyboard-open .app-container {
    height: calc(100vh - var(--keyboard-height, 0px) - var(--mobile-header-height));
    overflow-y: auto;
  }

  .keyboard-open .form-card {
    margin-bottom: var(--spacing-xl);
  }

  /* Enhanced touch feedback */
  .app-title:active {
    transform: scale(0.98);
    transition: transform var(--mobile-transition-fast) ease;
  }

  .header-actions button:active {
    transform: scale(0.95);
    transition: transform var(--mobile-transition-fast) ease;
  }
}

/* Enhanced Performance Optimizations */
.low-end-device .app-container {
  animation-duration: calc(0.6s * var(--animation-duration-multiplier, 1));
}

.low-end-device .form-progress :deep(.el-progress-bar__inner) {
  transition-duration: calc(0.6s * var(--animation-duration-multiplier, 1));
}

/* Auto Dark Theme Support */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) .app-header {
    background: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border-primary);
  }

  :root:not([data-theme]) .form-card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    box-shadow: var(--shadow-lg);
  }

  :root:not([data-theme]) .card-header {
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border-primary);
  }
}
</style>
