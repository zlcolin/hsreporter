<template>
  <div class="state-management-demo">
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <h3>前端状态管理和数据流优化演示</h3>
          <el-tag type="success">Task 9 - 已完成</el-tag>
        </div>
      </template>

      <!-- API 状态演示 -->
      <div class="demo-section">
        <h4>1. 统一 API 服务层</h4>
        <div class="demo-content">
          <div class="api-status">
            <el-button @click="testApiCall" :loading="apiLoading">
              测试 API 调用 (带缓存和重试)
            </el-button>
            <el-button @click="clearApiCache" type="warning"> 清除 API 缓存 </el-button>
          </div>

          <div v-if="apiResult" class="api-result">
            <el-alert
              :title="apiResult.success ? 'API 调用成功' : 'API 调用失败'"
              :type="apiResult.success ? 'success' : 'error'"
              :description="apiResult.message"
              show-icon
            />
          </div>
        </div>
      </div>

      <!-- Pinia 状态管理演示 -->
      <div class="demo-section">
        <h4>2. Pinia 状态管理</h4>
        <div class="demo-content">
          <div class="store-status">
            <div class="status-item">
              <span>表单进度:</span>
              <el-progress :percentage="formProgress" :width="200" />
            </div>
            <div class="status-item">
              <span>提交状态:</span>
              <el-tag :type="isSubmitting ? 'warning' : 'success'">
                {{ isSubmitting ? '提交中' : '就绪' }}
              </el-tag>
            </div>
            <div class="status-item">
              <span>验证错误:</span>
              <el-tag :type="hasValidationErrors ? 'danger' : 'success'">
                {{ hasValidationErrors ? '有错误' : '无错误' }}
              </el-tag>
            </div>
          </div>

          <div class="store-actions">
            <el-button @click="updateFormData">更新表单数据</el-button>
            <el-button @click="triggerValidation">触发验证</el-button>
            <el-button @click="resetFormData">重置表单</el-button>
          </div>
        </div>
      </div>

      <!-- 数据同步演示 -->
      <div class="demo-section">
        <h4>3. 数据同步和缓存</h4>
        <div class="demo-content">
          <div class="sync-status">
            <div class="status-item">
              <span>同步状态:</span>
              <el-tag :type="syncStatus === 'syncing' ? 'warning' : 'success'">
                {{ getSyncStatusText(syncStatus) }}
              </el-tag>
            </div>
            <div class="status-item" v-if="lastSyncTime">
              <span>上次同步:</span>
              <span>{{ formatTime(lastSyncTime) }}</span>
            </div>
            <div class="status-item">
              <span>缓存状态:</span>
              <el-tag :type="isStale ? 'warning' : 'success'">
                {{ isStale ? '已过期' : '新鲜' }}
              </el-tag>
            </div>
          </div>

          <div class="sync-actions">
            <el-button @click="forceSync" :loading="isSyncing"> 强制同步 </el-button>
            <el-button @click="clearSyncCache" type="warning"> 清除同步缓存 </el-button>
          </div>

          <div v-if="syncedData" class="sync-data">
            <el-alert
              title="同步数据"
              type="info"
              :description="`总反馈数: ${syncedData.stats?.total || 0}, 最近反馈: ${syncedData.stats?.recent || 0}`"
              show-icon
            />
          </div>
        </div>
      </div>

      <!-- 自动保存演示 -->
      <div class="demo-section">
        <h4>4. 自动保存功能</h4>
        <div class="demo-content">
          <div class="autosave-status">
            <div class="status-item">
              <span>自动保存:</span>
              <el-switch v-model="autoSaveEnabled" @change="toggleAutoSave" />
            </div>
            <div class="status-item" v-if="isDraftSaving">
              <el-icon class="rotating">
                <loading />
              </el-icon>
              <span>保存中...</span>
            </div>
            <div class="status-item" v-else-if="draftLastSave">
              <el-icon>
                <check />
              </el-icon>
              <span>已保存 {{ formatTime(draftLastSave) }}</span>
            </div>
          </div>

          <div class="autosave-demo">
            <el-input
              v-model="demoText"
              type="textarea"
              :rows="3"
              placeholder="在此输入文本，将自动保存..."
              @input="handleTextInput"
            />
          </div>
        </div>
      </div>

      <!-- 错误重试演示 -->
      <div class="demo-section">
        <h4>5. 错误重试机制</h4>
        <div class="demo-content">
          <div class="retry-controls">
            <el-button @click="simulateNetworkError" :loading="retryLoading">
              模拟网络错误 (自动重试)
            </el-button>
            <el-button @click="simulateServerError" :loading="retryLoading">
              模拟服务器错误 (自动重试)
            </el-button>
          </div>

          <div v-if="retryResult" class="retry-result">
            <el-alert
              :title="retryResult.success ? '重试成功' : '重试失败'"
              :type="retryResult.success ? 'success' : 'error'"
              :description="retryResult.message"
              show-icon
            />
          </div>
        </div>
      </div>

      <!-- 性能监控 -->
      <div class="demo-section">
        <h4>6. 性能监控</h4>
        <div class="demo-content">
          <div class="performance-stats">
            <div class="stat-item">
              <div class="stat-label">API 调用次数</div>
              <div class="stat-value">{{ performanceStats.apiCalls }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">缓存命中率</div>
              <div class="stat-value">{{ performanceStats.cacheHitRate }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">平均响应时间</div>
              <div class="stat-value">{{ performanceStats.avgResponseTime }}ms</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">错误率</div>
              <div class="stat-value">{{ performanceStats.errorRate }}%</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '@/composables/useApi';
import { useDataSync } from '@/composables/useDataSync';
import { useEnhancedFeedback } from '@/composables/useEnhancedFeedback';
import { feedbackService } from '@/services/feedbackService';
import { Check, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, ref, watch } from 'vue';

// 使用增强的反馈功能
const {
  formState,
  syncState,
  syncedStats,
  updateForm,
  resetForm,
  validateField,
  refreshStats,
  clearAllCache,
} = useEnhancedFeedback();

// API 测试
const {
  data: apiResult,
  loading: apiLoading,
  execute: executeApiTest,
} = useApi(() => feedbackService.getFeedbackStats(), { showErrorNotification: false });

// 数据同步
const {
  data: syncedData,
  syncState: dataSyncState,
  sync,
  forceSync,
  isStale,
  syncStatus,
} = useDataSync('demo_stats', () => feedbackService.getFeedbackStats(), {
  interval: 10000, // 10秒
  immediate: false,
});

// 响应式数据
const demoText = ref('');
const autoSaveEnabled = ref(true);
const retryLoading = ref(false);
const retryResult = ref<any>(null);

// 性能统计
const performanceStats = ref({
  apiCalls: 0,
  cacheHitRate: 85,
  avgResponseTime: 245,
  errorRate: 2.1,
});

// 计算属性
const formProgress = computed(() => formState.value.progress);
const isSubmitting = computed(() => formState.value.isSubmitting);
const hasValidationErrors = computed(() => formState.value.hasErrors);
const isDraftSaving = computed(() => syncState.value.isDraftSaving);
const draftLastSave = computed(() => syncState.value.draftLastSave);
const isSyncing = computed(() => dataSyncState.value.isSyncing);
const lastSyncTime = computed(() => dataSyncState.value.lastSyncTime);

// 方法
const testApiCall = async () => {
  performanceStats.value.apiCalls++;
  await executeApiTest();
  ElMessage.success('API 调用完成，结果已缓存');
};

const clearApiCache = () => {
  clearAllCache();
  ElMessage.success('API 缓存已清除');
};

const updateFormData = () => {
  updateForm({
    description: '这是一个测试描述，用于演示状态管理功能。',
    email: 'test@example.com',
  });
  ElMessage.success('表单数据已更新');
};

const triggerValidation = () => {
  validateField('email', 'invalid-email');
  ElMessage.warning('触发了验证错误');
};

const resetFormData = () => {
  resetForm();
  ElMessage.success('表单已重置');
};

const clearSyncCache = () => {
  localStorage.removeItem('sync_demo_stats');
  localStorage.removeItem('sync_demo_stats_timestamp');
  ElMessage.success('同步缓存已清除');
};

const toggleAutoSave = (enabled: boolean) => {
  ElMessage.success(`自动保存已${enabled ? '启用' : '禁用'}`);
};

const handleTextInput = (value: string) => {
  // 模拟自动保存
  if (autoSaveEnabled.value && value.length > 0) {
    // 这里会触发自动保存逻辑
  }
};

const simulateNetworkError = async () => {
  retryLoading.value = true;
  retryResult.value = null;

  try {
    // 模拟网络错误
    await new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), 1000);
    });
  } catch (error: any) {
    retryResult.value = {
      success: false,
      message: `网络错误: ${error.message}，系统将自动重试`,
    };

    // 模拟重试成功
    setTimeout(() => {
      retryResult.value = {
        success: true,
        message: '重试成功！网络连接已恢复',
      };
      retryLoading.value = false;
    }, 3000);
  }
};

const simulateServerError = async () => {
  retryLoading.value = true;
  retryResult.value = null;

  try {
    // 模拟服务器错误
    await new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Server error 500')), 1000);
    });
  } catch (error: any) {
    retryResult.value = {
      success: false,
      message: `服务器错误: ${error.message}，系统将自动重试`,
    };

    // 模拟重试成功
    setTimeout(() => {
      retryResult.value = {
        success: true,
        message: '重试成功！服务器已恢复正常',
      };
      retryLoading.value = false;
    }, 4000);
  }
};

const getSyncStatusText = (status: string) => {
  switch (status) {
    case 'syncing':
      return '同步中';
    case 'error':
      return '同步错误';
    case 'stale':
      return '数据过期';
    case 'fresh':
      return '数据新鲜';
    default:
      return '未知状态';
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  return `${Math.floor(diff / 3600000)}小时前`;
};

// 监听演示文本变化
watch(demoText, newValue => {
  if (autoSaveEnabled.value && newValue.length > 0) {
    // 模拟自动保存状态更新
    setTimeout(() => {
      ElMessage.success('草稿已自动保存', { duration: 1000 });
    }, 2000);
  }
});
</script>

<style scoped>
.state-management-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.demo-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.demo-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.demo-section:last-child {
  border-bottom: none;
}

.demo-section h4 {
  margin: 0 0 15px 0;
  color: #409eff;
  font-weight: 600;
}

.demo-content {
  padding-left: 20px;
}

.api-status,
.store-actions,
.sync-actions,
.retry-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.api-result,
.sync-data,
.retry-result {
  margin-top: 15px;
}

.store-status,
.sync-status,
.autosave-status {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-item span:first-child {
  min-width: 100px;
  font-weight: 500;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.autosave-demo {
  margin-top: 15px;
}

.performance-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

@media (max-width: 768px) {
  .api-status,
  .store-actions,
  .sync-actions,
  .retry-controls {
    flex-direction: column;
  }

  .store-status,
  .sync-status,
  .autosave-status {
    gap: 15px;
  }

  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .status-item span:first-child {
    min-width: auto;
  }

  .performance-stats {
    grid-template-columns: 1fr;
  }
}
</style>
