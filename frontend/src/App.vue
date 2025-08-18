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
      <responsive-card class="form-card" :mobile-optimized="true" :full-height="false" shadow="auto" rounded="large">
        <template #header>
          <div class="card-header">
            <h2 class="card-title">提交反馈</h2>
            <div class="form-progress" v-if="formProgress > 0">
              <el-progress :percentage="formProgress" :stroke-width="isMobile ? 3 : 4" :show-text="false"
                status="success" />
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

/* Mobile Styles */
@media (max-width: 767px) {
  .app-title {
    font-size: var(--font-size-lg);
  }

  .header-content {
    flex-direction: row;
    justify-content: space-between;
    padding: 0 var(--spacing-md);
  }

  .card-header {
    padding: var(--spacing-lg);
  }

  .card-title {
    font-size: var(--font-size-xl);
  }
}

/* Extra Small Mobile */
@media (max-width: 479px) {
  .header-content {
    padding: 0 var(--spacing-sm);
  }

  .app-title {
    font-size: var(--font-size-base);
  }

  .card-title {
    font-size: var(--font-size-lg);
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

/* Safe Area Support for iOS */
@supports (padding: max(0px)) {
  .app-header {
    padding-top: max(var(--spacing-md), env(safe-area-inset-top));
  }

  .app-container {
    padding-left: max(0px, env(safe-area-inset-left));
    padding-right: max(0px, env(safe-area-inset-right));
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
}
</style>
