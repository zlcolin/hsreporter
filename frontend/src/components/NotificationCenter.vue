<template>
  <teleport to="body">
    <div class="notification-center">
      <transition-group name="notification" tag="div" class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="getNotificationClass(notification)"
          class="notification-item"
        >
          <div class="notification-icon">
            <el-icon :size="20">
              <component :is="getNotificationIcon(notification.type)" />
            </el-icon>
          </div>

          <div class="notification-content">
            <div v-if="notification.title" class="notification-title">
              {{ notification.title }}
            </div>
            <div class="notification-message">
              {{ notification.message }}
            </div>
            <div v-if="notification.actions" class="notification-actions">
              <el-button
                v-for="action in notification.actions"
                :key="action.label"
                :type="action.type || 'text'"
                size="small"
                @click="handleAction(notification, action)"
              >
                {{ action.label }}
              </el-button>
            </div>
          </div>

          <div class="notification-close" @click="removeNotification(notification.id)">
            <el-icon :size="16">
              <close />
            </el-icon>
          </div>

          <!-- 进度条（用于自动关闭） -->
          <div
            v-if="notification.duration && notification.duration > 0"
            class="notification-progress"
            :style="{ animationDuration: `${notification.duration}ms` }"
          ></div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Close, CircleCheck, Warning, InfoFilled, CircleClose } from '@element-plus/icons-vue';

export interface NotificationAction {
  label: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text';
  handler: () => void;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title?: string;
  message: string;
  duration?: number; // 0 表示不自动关闭
  actions?: NotificationAction[];
  persistent?: boolean; // 是否持久化显示
}

const notifications = ref<NotificationItem[]>([]);
const timers = new Map<string, NodeJS.Timeout>();

// 添加通知
const addNotification = (notification: Omit<NotificationItem, 'id'>) => {
  const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newNotification: NotificationItem = {
    id,
    duration: 4500, // 默认4.5秒
    ...notification,
  };

  notifications.value.push(newNotification);

  // 设置自动关闭
  if (newNotification.duration && newNotification.duration > 0 && !newNotification.persistent) {
    const timer = setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);
    timers.set(id, timer);
  }

  return id;
};

// 移除通知
const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }

  // 清除定时器
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
};

// 清除所有通知
const clearAll = () => {
  notifications.value = [];
  timers.forEach(timer => clearTimeout(timer));
  timers.clear();
};

// 处理操作按钮点击
const handleAction = (notification: NotificationItem, action: NotificationAction) => {
  action.handler();
  // 执行操作后移除通知（除非是持久化通知）
  if (!notification.persistent) {
    removeNotification(notification.id);
  }
};

// 获取通知样式类
const getNotificationClass = (notification: NotificationItem) => {
  return {
    [`notification-${notification.type}`]: true,
    'notification-persistent': notification.persistent,
  };
};

// 获取通知图标
const getNotificationIcon = (type: NotificationItem['type']) => {
  const iconMap = {
    success: CircleCheck,
    warning: Warning,
    info: InfoFilled,
    error: CircleClose,
  };
  return iconMap[type];
};

// 便捷方法
const success = (message: string, options?: Partial<NotificationItem>) => {
  return addNotification({ type: 'success', message, ...options });
};

const warning = (message: string, options?: Partial<NotificationItem>) => {
  return addNotification({ type: 'warning', message, ...options });
};

const info = (message: string, options?: Partial<NotificationItem>) => {
  return addNotification({ type: 'info', message, ...options });
};

const error = (message: string, options?: Partial<NotificationItem>) => {
  return addNotification({ type: 'error', message, duration: 0, ...options });
};

// 清理定时器
onUnmounted(() => {
  timers.forEach(timer => clearTimeout(timer));
  timers.clear();
});

// 暴露方法给父组件
defineExpose({
  addNotification,
  removeNotification,
  clearAll,
  success,
  warning,
  info,
  error,
});
</script>

<style scoped>
.notification-center {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
  pointer-events: auto;
  overflow: hidden;
  min-width: 320px;
  max-width: 400px;
}

.notification-success {
  border-left-color: var(--el-color-success);
}

.notification-warning {
  border-left-color: var(--el-color-warning);
}

.notification-info {
  border-left-color: var(--el-color-info);
}

.notification-error {
  border-left-color: var(--el-color-danger);
}

.notification-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-success .notification-icon {
  color: var(--el-color-success);
}

.notification-warning .notification-icon {
  color: var(--el-color-warning);
}

.notification-info .notification-icon {
  color: var(--el-color-info);
}

.notification-error .notification-icon {
  color: var(--el-color-danger);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-message {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  word-break: break-word;
}

.notification-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.notification-close {
  flex-shrink: 0;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: color 0.3s ease;
  padding: 2px;
  border-radius: 2px;
}

.notification-close:hover {
  color: var(--el-text-color-primary);
  background-color: var(--el-fill-color-light);
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background-color: currentColor;
  opacity: 0.3;
  animation: progress-shrink linear forwards;
}

/* 进度条动画 */
@keyframes progress-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* 通知进入/离开动画 */
.notification-enter-active {
  transition: all 0.3s ease-out;
}

.notification-leave-active {
  transition: all 0.3s ease-in;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-center {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .notification-list {
    max-width: none;
  }

  .notification-item {
    min-width: auto;
    max-width: none;
    padding: 12px;
  }

  .notification-title {
    font-size: 13px;
  }

  .notification-message {
    font-size: 12px;
  }
}

/* 持久化通知样式 */
.notification-persistent {
  border-left-width: 6px;
}

.notification-persistent .notification-progress {
  display: none;
}
</style>
