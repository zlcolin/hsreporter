import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import type { MessageOptions, NotificationOptions, MessageBoxOptions } from 'element-plus';

export interface NotificationConfig {
  title?: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  duration?: number;
  showClose?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface MessageConfig {
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  duration?: number;
  showClose?: boolean;
  center?: boolean;
}

export interface ConfirmConfig {
  title?: string;
  message: string;
  type?: 'warning' | 'info' | 'success' | 'error';
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
}

export function useNotification() {
  // 显示消息提示
  const showMessage = (config: MessageConfig | string) => {
    const options: MessageOptions =
      typeof config === 'string'
        ? { message: config }
        : {
            message: config.message,
            type: config.type || 'info',
            duration: config.duration || 3000,
            showClose: config.showClose || false,
            center: config.center || false,
          };

    return ElMessage(options);
  };

  // 显示通知
  const showNotification = (config: NotificationConfig) => {
    const options: NotificationOptions = {
      title: config.title || '',
      message: config.message,
      type: config.type || 'info',
      duration: config.duration || 4500,
      showClose: config.showClose !== false,
      position: config.position || 'top-right',
    };

    return ElNotification(options);
  };

  // 显示确认对话框
  const showConfirm = async (config: ConfirmConfig | string): Promise<boolean> => {
    const options: MessageBoxOptions =
      typeof config === 'string'
        ? { message: config }
        : {
            title: config.title || '确认',
            message: config.message,
            type: config.type || 'warning',
            confirmButtonText: config.confirmButtonText || '确定',
            cancelButtonText: config.cancelButtonText || '取消',
            showCancelButton: config.showCancelButton !== false,
          };

    try {
      await ElMessageBox.confirm(options.message!, options.title, options);
      return true;
    } catch {
      return false;
    }
  };

  // 便捷方法
  const success = (message: string, title?: string) => {
    if (title) {
      showNotification({ message, title, type: 'success' });
    } else {
      showMessage({ message, type: 'success' });
    }
  };

  const error = (message: string, title?: string) => {
    if (title) {
      showNotification({ message, title, type: 'error' });
    } else {
      showMessage({ message, type: 'error' });
    }
  };

  const warning = (message: string, title?: string) => {
    if (title) {
      showNotification({ message, title, type: 'warning' });
    } else {
      showMessage({ message, type: 'warning' });
    }
  };

  const info = (message: string, title?: string) => {
    if (title) {
      showNotification({ message, title, type: 'info' });
    } else {
      showMessage({ message, type: 'info' });
    }
  };

  // 表单验证错误提示
  const showValidationError = (errors: string[]) => {
    const message = errors.length === 1 ? errors[0] : `表单验证失败：\n${errors.join('\n')}`;

    showMessage({
      message,
      type: 'error',
      duration: 5000,
      showClose: true,
    });
  };

  // 操作成功提示
  const showOperationSuccess = (operation: string, details?: string) => {
    const message = details ? `${operation}成功：${details}` : `${operation}成功`;
    showNotification({
      title: '操作成功',
      message,
      type: 'success',
      duration: 3000,
    });
  };

  // 操作失败提示
  const showOperationError = (operation: string, error?: string) => {
    const message = error ? `${operation}失败：${error}` : `${operation}失败`;
    showNotification({
      title: '操作失败',
      message,
      type: 'error',
      duration: 5000,
    });
  };

  return {
    showMessage,
    showNotification,
    showConfirm,
    success,
    error,
    warning,
    info,
    showValidationError,
    showOperationSuccess,
    showOperationError,
  };
}
