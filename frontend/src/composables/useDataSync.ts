import { useIntervalFn, useLocalStorage, useOnline } from '@vueuse/core';
import { computed, onUnmounted, ref, watch, type Ref } from 'vue';
import { useNotification } from './useNotification';

export interface SyncOptions {
  interval?: number;
  immediate?: boolean;
  enabled?: boolean;
  onlineOnly?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  syncCount: number;
  failedSyncCount: number;
}

/**
 * 数据同步组合式函数
 */
export function useDataSync<T>(
  key: string,
  syncFunction: () => Promise<T>,
  options: SyncOptions = {}
) {
  const {
    interval = 30000, // 30秒
    immediate = true,
    enabled = true,
    onlineOnly = true,
    retryOnError = true,
    maxRetries = 3,
    retryDelay = 5000,
  } = options;

  const isOnline = useOnline();
  const { showError } = useNotification();

  // 同步状态
  const syncState = ref<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    syncError: null,
    syncCount: 0,
    failedSyncCount: 0,
  });

  // 数据存储
  const data = ref<T | null>(null);
  const localData = useLocalStorage(`sync_${key}`, null);

  // 重试计数
  const retryCount = ref(0);

  // 计算属性
  const canSync = computed(() => {
    return enabled && (!onlineOnly || isOnline.value) && !syncState.value.isSyncing;
  });

  const isStale = computed(() => {
    if (!syncState.value.lastSyncTime) return true;
    const now = Date.now();
    const lastSync = syncState.value.lastSyncTime.getTime();
    return now - lastSync > interval * 2; // 认为超过2个间隔时间就是过期的
  });

  const syncStatus = computed(() => {
    if (syncState.value.isSyncing) return 'syncing';
    if (syncState.value.syncError) return 'error';
    if (isStale.value) return 'stale';
    return 'fresh';
  });

  // 执行同步
  const sync = async (showNotification = false): Promise<T | null> => {
    if (!canSync.value) {
      return data.value;
    }

    syncState.value.isSyncing = true;
    syncState.value.syncError = null;

    try {
      const result = await syncFunction();

      // 更新数据
      data.value = result;
      localData.value = result;

      // 更新同步状态
      syncState.value.lastSyncTime = new Date();
      syncState.value.syncCount++;
      retryCount.value = 0;

      if (showNotification) {
        // 可以在这里显示同步成功的通知
      }

      return result;
    } catch (error: any) {
      syncState.value.syncError = error.message || '同步失败';
      syncState.value.failedSyncCount++;

      if (showNotification) {
        showError(`数据同步失败: ${syncState.value.syncError}`);
      }

      // 重试逻辑
      if (retryOnError && retryCount.value < maxRetries) {
        retryCount.value++;
        setTimeout(() => {
          if (canSync.value) {
            sync(false); // 重试时不显示通知
          }
        }, retryDelay * retryCount.value);
      }

      throw error;
    } finally {
      syncState.value.isSyncing = false;
    }
  };

  // 强制同步
  const forceSync = () => sync(true);

  // 重置同步状态
  const resetSync = () => {
    syncState.value = {
      isSyncing: false,
      lastSyncTime: null,
      syncError: null,
      syncCount: 0,
      failedSyncCount: 0,
    };
    retryCount.value = 0;
  };

  // 从本地存储加载数据
  const loadFromLocal = () => {
    if (localData.value) {
      data.value = localData.value;
    }
  };

  // 设置定时同步
  const { pause, resume, isActive } = useIntervalFn(
    () => {
      if (canSync.value) {
        sync(false);
      }
    },
    interval,
    { immediate: false }
  );

  // 监听在线状态变化
  watch(isOnline, online => {
    if (online && onlineOnly && enabled) {
      // 重新上线时立即同步
      sync(false);
      if (!isActive.value) {
        resume();
      }
    } else if (!online && onlineOnly) {
      // 离线时暂停同步
      pause();
    }
  });

  // 监听启用状态变化
  watch(
    () => enabled,
    newEnabled => {
      if (newEnabled) {
        if (immediate) {
          sync(false);
        }
        resume();
      } else {
        pause();
      }
    }
  );

  // 初始化
  if (enabled) {
    // 先从本地加载数据
    loadFromLocal();

    // 如果设置了立即同步且可以同步，则执行同步
    if (immediate && canSync.value) {
      sync(false);
    }

    // 启动定时同步
    resume();
  }

  // 清理
  onUnmounted(() => {
    pause();
  });

  return {
    data,
    syncState,
    canSync,
    isStale,
    syncStatus,
    sync,
    forceSync,
    resetSync,
    loadFromLocal,
    pause,
    resume,
    isActive,
  };
}

/**
 * 多数据源同步组合式函数
 */
export function useMultiDataSync() {
  const syncers = ref<Map<string, ReturnType<typeof useDataSync>>>(new Map());

  const addSyncer = <T>(key: string, syncFunction: () => Promise<T>, options?: SyncOptions) => {
    const syncer = useDataSync(key, syncFunction, options);
    syncers.value.set(key, syncer);
    return syncer;
  };

  const removeSyncer = (key: string) => {
    const syncer = syncers.value.get(key);
    if (syncer) {
      syncer.pause();
      syncers.value.delete(key);
    }
  };

  const getSyncer = (key: string) => {
    return syncers.value.get(key);
  };

  const syncAll = async (showNotification = false) => {
    const promises = Array.from(syncers.value.values()).map(syncer =>
      syncer.sync(showNotification).catch(err => err)
    );

    return Promise.allSettled(promises);
  };

  const pauseAll = () => {
    syncers.value.forEach(syncer => syncer.pause());
  };

  const resumeAll = () => {
    syncers.value.forEach(syncer => syncer.resume());
  };

  const resetAll = () => {
    syncers.value.forEach(syncer => syncer.resetSync());
  };

  const globalSyncState = computed(() => {
    const states = Array.from(syncers.value.values()).map(syncer => syncer.syncState.value);

    return {
      totalSyncers: states.length,
      activeSyncers: states.filter(state => state.isSyncing).length,
      errorSyncers: states.filter(state => state.syncError).length,
      totalSyncCount: states.reduce((sum, state) => sum + state.syncCount, 0),
      totalFailedCount: states.reduce((sum, state) => sum + state.failedSyncCount, 0),
    };
  });

  return {
    syncers,
    addSyncer,
    removeSyncer,
    getSyncer,
    syncAll,
    pauseAll,
    resumeAll,
    resetAll,
    globalSyncState,
  };
}

/**
 * 表单数据自动保存组合式函数
 */
export function useAutoSave<T extends Record<string, any>>(
  key: string,
  data: Ref<T>,
  saveFunction: (data: T) => Promise<void>,
  options: {
    delay?: number;
    enabled?: boolean;
    onSave?: (data: T) => void;
    onError?: (error: any) => void;
  } = {}
) {
  const {
    delay = 2000, // 2秒延迟
    enabled = true,
    onSave,
    onError,
  } = options;

  const isSaving = ref(false);
  const lastSaveTime = ref<Date | null>(null);
  const saveError = ref<string | null>(null);
  const pendingSave = ref(false);

  let saveTimeout: number | null = null;

  // 执行保存
  const save = async () => {
    if (!enabled || isSaving.value) return;

    isSaving.value = true;
    saveError.value = null;
    pendingSave.value = false;

    try {
      await saveFunction(data.value);
      lastSaveTime.value = new Date();

      if (onSave) {
        onSave(data.value);
      }
    } catch (error: any) {
      saveError.value = error.message || '保存失败';

      if (onError) {
        onError(error);
      }
    } finally {
      isSaving.value = false;
    }
  };

  // 延迟保存
  const debouncedSave = () => {
    if (!enabled) return;

    pendingSave.value = true;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = window.setTimeout(() => {
      save();
    }, delay);
  };

  // 立即保存
  const saveNow = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    return save();
  };

  // 监听数据变化
  watch(
    data,
    () => {
      if (enabled) {
        debouncedSave();
      }
    },
    { deep: true }
  );

  // 清理
  onUnmounted(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
  });

  return {
    isSaving,
    lastSaveTime,
    saveError,
    pendingSave,
    save: saveNow,
    debouncedSave,
  };
}
