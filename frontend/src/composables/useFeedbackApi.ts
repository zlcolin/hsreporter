import {
  feedbackService,
  type FeedbackStatsResult,
  type FeedbackStatusResult,
  type FeedbackSubmissionResult,
} from '@/services/feedbackService';
import { useFeedbackStore } from '@/stores/feedback';
import type { FormData } from '@/types/common';
import { computed, ref } from 'vue';
import { useApi, useCachedApi } from './useApi';
import { useNotification } from './useNotification';

/**
 * 反馈API操作组合式函数
 */
export function useFeedbackApi() {
  const feedbackStore = useFeedbackStore();
  const { showSuccess, showError, showOperationSuccess, showOperationError } = useNotification();

  // 提交反馈
  const {
    data: submissionResult,
    loading: isSubmitting,
    error: submissionError,
    execute: executeSubmission,
  } = useApi((formData: FormData) => feedbackService.submitFeedback(formData), {
    showErrorNotification: false, // 我们手动处理通知
    showSuccessNotification: false,
  });

  // 查询反馈状态
  const {
    data: statusResult,
    loading: isLoadingStatus,
    error: statusError,
    execute: executeStatusQuery,
  } = useCachedApi('feedback_status', (id: string) => feedbackService.getFeedbackStatus(id), {
    cacheTime: 2 * 60 * 1000, // 2分钟缓存
    staleTime: 30 * 1000, // 30秒过期
    showErrorNotification: false,
  });

  // 获取反馈统计
  const {
    data: statsResult,
    loading: isLoadingStats,
    error: statsError,
    execute: executeStatsQuery,
    isStale: isStatsStale,
  } = useCachedApi('feedback_stats', () => feedbackService.getFeedbackStats(), {
    cacheTime: 10 * 60 * 1000, // 10分钟缓存
    staleTime: 2 * 60 * 1000, // 2分钟过期
    immediate: false,
    showErrorNotification: false,
  });

  // 文件上传状态
  const uploadProgress = ref<Record<string, number>>({});
  const uploadingFiles = ref<Set<string>>(new Set());

  // 计算属性
  const canSubmit = computed(() => {
    return feedbackStore.canSubmit && !isSubmitting.value;
  });

  const hasActiveUploads = computed(() => {
    return uploadingFiles.value.size > 0;
  });

  const overallUploadProgress = computed(() => {
    const progresses = Object.values(uploadProgress.value);
    if (progresses.length === 0) return 0;

    const total = progresses.reduce((sum, progress) => sum + progress, 0);
    return Math.round(total / progresses.length);
  });

  // 提交反馈
  const submitFeedback = async (): Promise<FeedbackSubmissionResult> => {
    try {
      const result = await executeSubmission(feedbackStore.currentForm);

      if (result?.success) {
        showOperationSuccess('反馈提交', `问题编号: ${result.issueId}`);

        // 更新store状态
        await feedbackStore.submitForm();

        // 清除缓存以获取最新统计
        clearStatsCache();

        return result;
      } else {
        const errorMsg = result?.error || '提交失败';
        showOperationError('反馈提交', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      const errorMsg = error.message || '提交失败';
      showOperationError('反馈提交', errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // 查询反馈状态
  const getFeedbackStatus = async (id: string): Promise<FeedbackStatusResult> => {
    try {
      const result = await executeStatusQuery(id);

      if (result?.success) {
        return result;
      } else {
        const errorMsg = result?.error || '查询失败';
        showError(`查询反馈状态失败: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      const errorMsg = error.message || '查询失败';
      showError(`查询反馈状态失败: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  };

  // 获取反馈统计
  const getFeedbackStats = async (forceRefresh = false): Promise<FeedbackStatsResult> => {
    try {
      if (forceRefresh) {
        clearStatsCache();
      }

      const result = await executeStatsQuery();

      if (result?.success) {
        return result;
      } else {
        const errorMsg = result?.error || '获取统计失败';
        if (forceRefresh) {
          showError(`获取统计信息失败: ${errorMsg}`);
        }
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      const errorMsg = error.message || '获取统计失败';
      if (forceRefresh) {
        showError(`获取统计信息失败: ${errorMsg}`);
      }
      return { success: false, error: errorMsg };
    }
  };

  // 上传文件
  const uploadFile = async (
    file: File
  ): Promise<{ success: boolean; fileId?: string; error?: string }> => {
    const fileKey = `${file.name}_${file.size}_${file.lastModified}`;

    try {
      uploadingFiles.value.add(fileKey);
      uploadProgress.value[fileKey] = 0;

      const result = await feedbackService.uploadFile(file, progress => {
        uploadProgress.value[fileKey] = progress;
      });

      if (result.success) {
        showSuccess(`文件 "${file.name}" 上传成功`);
        return { success: true, fileId: result.fileId };
      } else {
        showError(`文件 "${file.name}" 上传失败: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMsg = error.message || '上传失败';
      showError(`文件 "${file.name}" 上传失败: ${errorMsg}`);
      return { success: false, error: errorMsg };
    } finally {
      uploadingFiles.value.delete(fileKey);
      delete uploadProgress.value[fileKey];
    }
  };

  // 删除文件
  const deleteFile = async (
    fileId: string,
    fileName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await feedbackService.deleteFile(fileId);

      if (result.success) {
        showSuccess(`文件${fileName ? ` "${fileName}"` : ''} 删除成功`);
        return { success: true };
      } else {
        showError(`文件删除失败: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMsg = error.message || '删除失败';
      showError(`文件删除失败: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  };

  // 清除统计缓存
  const clearStatsCache = () => {
    // 清除缓存的统计数据
    localStorage.removeItem('cached_api_feedback_stats');
    localStorage.removeItem('cached_api_feedback_stats_timestamp');
  };

  // 清除所有缓存
  const clearAllCache = () => {
    feedbackService.clearCache();
    clearStatsCache();
    localStorage.removeItem('cached_api_feedback_status');
    localStorage.removeItem('cached_api_feedback_status_timestamp');
  };

  // 重试提交
  const retrySubmission = async (): Promise<FeedbackSubmissionResult> => {
    return submitFeedback();
  };

  // 批量操作
  const batchUploadFiles = async (
    files: File[]
  ): Promise<Array<{ file: File; success: boolean; fileId?: string; error?: string }>> => {
    const results = [];

    for (const file of files) {
      const result = await uploadFile(file);
      results.push({
        file,
        ...result,
      });
    }

    return results;
  };

  return {
    // 状态
    submissionResult,
    statusResult,
    statsResult,
    isSubmitting,
    isLoadingStatus,
    isLoadingStats,
    submissionError,
    statusError,
    statsError,
    uploadProgress,
    uploadingFiles,
    isStatsStale,

    // 计算属性
    canSubmit,
    hasActiveUploads,
    overallUploadProgress,

    // 方法
    submitFeedback,
    getFeedbackStatus,
    getFeedbackStats,
    uploadFile,
    deleteFile,
    retrySubmission,
    batchUploadFiles,
    clearStatsCache,
    clearAllCache,
  };
}

/**
 * 反馈状态轮询组合式函数
 */
export function useFeedbackStatusPolling(id: string, interval = 30000) {
  const { getFeedbackStatus } = useFeedbackApi();
  const { showStatusUpdate } = useNotification();

  const isPolling = ref(false);
  const currentStatus = ref<string | null>(null);
  const pollInterval = ref<number | null>(null);

  const startPolling = () => {
    if (isPolling.value) return;

    isPolling.value = true;

    const poll = async () => {
      try {
        const result = await getFeedbackStatus(id);

        if (result.success && result.status) {
          const newStatus = result.status;

          // 如果状态发生变化，显示通知
          if (currentStatus.value && currentStatus.value !== newStatus) {
            showStatusUpdate('反馈状态更新', `状态已变更为: ${newStatus}`);
          }

          currentStatus.value = newStatus;

          // 如果状态为最终状态，停止轮询
          if (['resolved', 'closed', 'rejected'].includes(newStatus)) {
            stopPolling();
          }
        }
      } catch (error) {
        console.warn('Status polling error:', error);
      }
    };

    // 立即执行一次
    poll();

    // 设置定时器
    pollInterval.value = window.setInterval(poll, interval);
  };

  const stopPolling = () => {
    isPolling.value = false;

    if (pollInterval.value) {
      clearInterval(pollInterval.value);
      pollInterval.value = null;
    }
  };

  // 组件卸载时清理
  const cleanup = () => {
    stopPolling();
  };

  return {
    isPolling,
    currentStatus,
    startPolling,
    stopPolling,
    cleanup,
  };
}
