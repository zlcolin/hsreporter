import type { LoadingState, NotificationItem } from '@/types/store';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  // State
  const theme = ref<'light' | 'dark' | 'auto'>('auto');
  const language = ref<'zh-CN' | 'en-US'>('zh-CN');
  const isMobile = ref(false);
  const isTablet = ref(false);
  const isDesktop = ref(true);
  const notifications = ref<NotificationItem[]>([]);

  const loading = ref<LoadingState>({
    isLoading: false,
    message: '',
    progress: 0,
    error: null,
    showProgress: false,
  });

  // Getters
  const isDark = computed(() => {
    if (theme.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme.value === 'dark';
  });

  const hasNotifications = computed(() => notifications.value.length > 0);

  const unreadNotifications = computed(() => notifications.value.filter(n => !n.read));

  // Actions
  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    theme.value = newTheme;
    localStorage.setItem('app_theme', newTheme);
    updateThemeClass();
  };

  const setLanguage = (newLanguage: 'zh-CN' | 'en-US') => {
    language.value = newLanguage;
    localStorage.setItem('app_language', newLanguage);
  };

  const updateBreakpoints = (mobile: boolean, tablet: boolean, desktop: boolean) => {
    isMobile.value = mobile;
    isTablet.value = tablet;
    isDesktop.value = desktop;
  };

  const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    notifications.value.unshift(newNotification);

    // Auto remove notification after duration
    if (notification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration);
    }

    return newNotification.id;
  };

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  };

  const clearAllNotifications = () => {
    notifications.value = [];
  };

  const markNotificationAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  };

  // Loading state management
  const startLoading = (
    options: {
      message?: string;
      showProgress?: boolean;
      timeout?: number;
    } = {}
  ) => {
    loading.value = {
      isLoading: true,
      message: options.message || 'Loading...',
      progress: 0,
      error: null,
      showProgress: options.showProgress || false,
    };

    // Set timeout if specified
    if (options.timeout) {
      setTimeout(() => {
        if (loading.value.isLoading) {
          setLoadingError('Operation timed out');
        }
      }, options.timeout);
    }
  };

  const updateLoadingProgress = (progress: number, message?: string) => {
    if (loading.value.isLoading) {
      loading.value.progress = Math.max(0, Math.min(100, progress));
      if (message) {
        loading.value.message = message;
      }
    }
  };

  const finishLoading = (message?: string) => {
    loading.value = {
      isLoading: false,
      message: message || '',
      progress: 100,
      error: null,
      showProgress: false,
    };
  };

  const setLoadingError = (error: string) => {
    loading.value.error = error;
    loading.value.isLoading = false;
  };

  const resetLoading = () => {
    loading.value = {
      isLoading: false,
      message: '',
      progress: 0,
      error: null,
      showProgress: false,
    };
  };

  // Utility methods
  const updateThemeClass = () => {
    const html = document.documentElement;
    if (isDark.value) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const initializeApp = () => {
    // Load saved theme
    const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark' | 'auto';
    if (savedTheme) {
      theme.value = savedTheme;
    }

    // Load saved language
    const savedLanguage = localStorage.getItem('app_language') as 'zh-CN' | 'en-US';
    if (savedLanguage) {
      language.value = savedLanguage;
    }

    // Apply theme
    updateThemeClass();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeClass);
  };

  // Notification shortcuts
  const showSuccess = (message: string, title?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      type: 'success',
      title: title || 'Success',
      message,
      duration: 4000,
      ...options,
    });
  };

  const showError = (message: string, title?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      type: 'error',
      title: title || 'Error',
      message,
      duration: 6000,
      ...options,
    });
  };

  const showWarning = (message: string, title?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      type: 'warning',
      title: title || 'Warning',
      message,
      duration: 5000,
      ...options,
    });
  };

  const showInfo = (message: string, title?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      type: 'info',
      title: title || 'Info',
      message,
      duration: 3000,
      ...options,
    });
  };

  return {
    // State
    theme,
    language,
    isMobile,
    isTablet,
    isDesktop,
    notifications,
    loading,

    // Getters
    isDark,
    hasNotifications,
    unreadNotifications,

    // Actions
    setTheme,
    setLanguage,
    updateBreakpoints,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markNotificationAsRead,
    startLoading,
    updateLoadingProgress,
    finishLoading,
    setLoadingError,
    resetLoading,
    initializeApp,

    // Notification shortcuts
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
});
