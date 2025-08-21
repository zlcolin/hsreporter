import { useAppStore } from '@/stores/app';
import { useFeedbackStore } from '@/stores/feedback';
import { useUserStore } from '@/stores/user';
import type { FormData } from '@/types/common';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useAutoSave, useDataSync } from './useDataSync';
import { useFeedbackApi, useFeedbackStatusPolling } from './useFeedbackApi';
import { useNotification } from './useNotification';

/**
 * 增强的反馈管理组合式函数
 * 集成了状态管理、API调用、数据同步、自动保存等功能
 */
export function useEnhancedFeedback() {
  const feedbackStore = useFeedbackStore();
  const appStore = useAppStore();
  const userStore = useUserStore();
  const feedbackApi = useFeedbackApi();
  const { showSuccess, showError, showWarning } = useNotification();

  // 数据同步 - 定期获取反馈统计
  const {
    data: syncedStats,
    syncState: statsSyncState,
    sync: syncStats,
    forceSync: forceSyncStats,
  } = useDataSync('feedback_stats', () => feedbackApi.getFeedbackStats(true), {
    interval: 5 * 60 * 1000, // 5分钟同步一次
    immediate: false,
    enabled: true,
    onlineOnly: true,
  });

  // 自动保存草稿
  const {
    isSaving: isDraftSaving,
    lastSaveTime: draftLastSaveTime,
    saveError: draftSaveError,
    pendingSave: hasPendingDraftSave,
  } = useAutoSave(
    'feedback_draft',
    computed(() => feedbackStore.currentForm),
    async (data: FormData) => {
      if (data.description && data.description.length > 10) {
        feedbackStore.saveDraft();
      }
    },
    {
      delay: 2000,
      enabled: computed(() => userStore.preferences.autoSaveDraft),
      onSave: () => {
        if (userStore.preferences.notificationEnabled) {
          // 静默保存，不显示通知
        }
      },
      onError: error => {
        console.warn('Draft save error:', error);
      },
    }
  );

  // 状态轮询（当有提交记录时）
  const statusPolling = computed(() => {
    const lastSubmissionId = feedbackStore.lastSubmissionId;
    if (lastSubmissionId) {
      return useFeedbackStatusPolling(lastSubmissionId, 30000);
    }
    return null;
  });

  // 计算属性
  const formState = computed(() => ({
    isValid: feedbackStore.canSubmit,
    progress: feedbackStore.formProgress,
    hasErrors: feedbackStore.hasValidationErrors,
    isDirty: feedbackStore.currentForm.description.length > 0,
    isSubmitting: feedbackStore.isSubmitting || feedbackApi.isSubmitting,
    canSubmit: feedbackApi.canSubmit,
  }));

  const uploadState = computed(() => ({
    hasActiveUploads: feedbackApi.hasActiveUploads,
    overallProgress: feedbackApi.overallUploadProgress,
    uploadingFiles: Array.from(feedbackApi.uploadingFiles),
  }));

  const appState = computed(() => ({
    isOnline: navigator.onLine,
    isLoading: appStore.loading.isLoading,
    loadingMessage: appStore.loading.message,
    loadingProgress: appStore.loading.progress,
    hasNotifications: appStore.hasNotifications,
  }));

  const syncState = computed(() => ({
    isStatsSyncing: statsSyncState.value.isSyncing,
    lastStatsSync: statsSyncState.value.lastSyncTime,
    statsSyncError: statsSyncState.value.syncError,
    isDraftSaving: isDraftSaving.value,
    draftLastSave: draftLastSaveTime.value,
    hasPendingDraftSave: hasPendingDraftSave.value,
  }));

  // 表单操作方法
  const updateForm = (updates: Partial<FormData>) => {
    feedbackStore.updateForm(updates);
  };

  const resetForm = () => {
    feedbackStore.resetForm();
    feedbackApi.clearAllCache();
  };

  const validateField = (field: keyof FormData, value: any) => {
    const errors: string[] = [];

    switch (field) {
      case 'description':
        if (!value || value.trim().length < 10) {
          errors.push('问题描述至少需要10个字符');
        }
        if (value && value.length > 5000) {
          errors.push('问题描述不能超过5000个字符');
        }
        break;
      case 'email':
        if (value) {
          errors.push(...userStore.validateEmail(value));
        }
        break;
      case 'phone':
        if (value) {
          errors.push(...userStore.validatePhone(value));
        }
        break;
    }

    feedbackStore.setValidationError(field, errors);
    return errors.length === 0;
  };

  const validateForm = () => {
    const form = feedbackStore.currentForm;
    let isValid = true;

    // 验证所有字段
    Object.keys(form).forEach(key => {
      const fieldKey = key as keyof FormData;
      if (!validateField(fieldKey, form[fieldKey])) {
        isValid = false;
      }
    });

    return isValid;
  };

  // 提交操作
  const submitFeedback = async () => {
    if (!validateForm()) {
      showError('请修正表单中的错误后再提交');
      return { success: false, error: 'Validation failed' };
    }

    if (uploadState.value.hasActiveUploads) {
      showWarning('请等待文件上传完成后再提交');
      return { success: false, error: 'Files uploading' };
    }

    try {
      const result = await feedbackApi.submitFeedback();

      if (result.success) {
        // 提交成功后的操作
        resetForm();

        // 开始状态轮询
        if (statusPolling.value) {
          statusPolling.value.startPolling();
        }

        // 强制同步统计数据
        setTimeout(() => {
          forceSyncStats();
        }, 2000);
      }

      return result;
    } catch (error: any) {
      showError(`提交失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // 文件操作
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return [];

    try {
      const results = await feedbackApi.batchUploadFiles(files);

      // 更新表单中的文件列表
      const successfulUploads = results
        .filter(result => result.success)
        .map(result => ({
          id: result.fileId!,
          name: result.file.name,
          size: result.file.size,
          type: result.file.type,
        }));

      if (successfulUploads.length > 0) {
        updateForm({
          files: [...feedbackStore.currentForm.files, ...successfulUploads],
        });
      }

      return results;
    } catch (error: any) {
      showError(`文件上传失败: ${error.message}`);
      return [];
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      const file = feedbackStore.currentForm.files.find(f => f.id === fileId);
      const result = await feedbackApi.deleteFile(fileId, file?.name);

      if (result.success) {
        // 从表单中移除文件
        const updatedFiles = feedbackStore.currentForm.files.filter(f => f.id !== fileId);
        updateForm({ files: updatedFiles });
      }

      return result;
    } catch (error: any) {
      showError(`删除文件失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // 草稿操作
  const loadDraft = () => {
    const loaded = feedbackStore.loadDraft();
    if (loaded) {
      showSuccess('已加载保存的草稿');
    }
    return loaded;
  };

  const clearDraft = () => {
    feedbackStore.clearDraft();
    showSuccess('草稿已清除');
  };

  // 数据管理
  const refreshStats = () => {
    return forceSyncStats();
  };

  const clearAllData = () => {
    resetForm();
    feedbackApi.clearAllCache();
    feedbackStore.submissionHistory = [];
    localStorage.removeItem('submission_history');
    showSuccess('所有数据已清除');
  };

  // 监听在线状态变化
  watch(
    () => navigator.onLine,
    isOnline => {
      if (isOnline) {
        showSuccess('网络连接已恢复');
        // 重新同步数据
        setTimeout(() => {
          syncStats();
        }, 1000);
      } else {
        showWarning('网络连接已断开，将在本地保存数据');
      }
    }
  );

  // 监听用户偏好变化
  watch(
    () => userStore.preferences.autoSaveDraft,
    enabled => {
      if (enabled) {
        showSuccess('已启用自动保存草稿');
      } else {
        showWarning('已禁用自动保存草稿');
      }
    }
  );

  // 生命周期
  onMounted(() => {
    // 初始化时加载草稿
    if (userStore.preferences.autoSaveDraft) {
      loadDraft();
    }

    // 加载提交历史
    feedbackStore.loadSubmissionHistory();

    // 初始同步统计数据
    setTimeout(() => {
      syncStats();
    }, 1000);
  });

  onUnmounted(() => {
    // 清理状态轮询
    if (statusPolling.value) {
      statusPolling.value.cleanup();
    }
  });

  return {
    // 状态
    formState,
    uploadState,
    appState,
    syncState,

    // 数据
    currentForm: computed(() => feedbackStore.currentForm),
    submissionHistory: computed(() => feedbackStore.submissionHistory),
    validationErrors: computed(() => feedbackStore.validationErrors),
    syncedStats,

    // 表单操作
    updateForm,
    resetForm,
    validateField,
    validateForm,
    submitFeedback,

    // 文件操作
    uploadFiles,
    removeFile,

    // 草稿操作
    loadDraft,
    clearDraft,

    // 数据管理
    refreshStats,
    clearAllData,

    // API方法
    ...feedbackApi,
  };
}

/**
 * 简化的反馈表单组合式函数
 * 提供最常用的功能，适合简单场景
 */
export function useSimpleFeedback() {
  const enhanced = useEnhancedFeedback();

  return {
    // 基本状态
    form: enhanced.currentForm,
    isSubmitting: enhanced.formState.value.isSubmitting,
    canSubmit: enhanced.formState.value.canSubmit,
    progress: enhanced.formState.value.progress,

    // 基本操作
    updateForm: enhanced.updateForm,
    submitFeedback: enhanced.submitFeedback,
    resetForm: enhanced.resetForm,

    // 文件操作
    uploadFiles: enhanced.uploadFiles,
    removeFile: enhanced.removeFile,

    // 验证
    validateField: enhanced.validateField,
    errors: enhanced.validationErrors,
  };
}
