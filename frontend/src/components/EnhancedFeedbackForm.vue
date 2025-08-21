<template>
  <div class="enhanced-feedback-form">
    <!-- 状态指示器 -->
    <div class="status-bar" v-if="showStatusBar">
      <div class="status-item">
        <el-icon>
          <connection />
        </el-icon>
        <span :class="{ 'text-success': appState.isOnline, 'text-error': !appState.isOnline }">
          {{ appState.isOnline ? '在线' : '离线' }}
        </span>
      </div>

      <div class="status-item" v-if="syncState.isDraftSaving">
        <el-icon class="rotating">
          <loading />
        </el-icon>
        <span>保存草稿中...</span>
      </div>

      <div class="status-item" v-else-if="syncState.draftLastSave">
        <el-icon>
          <check />
        </el-icon>
        <span>已保存 {{ formatTime(syncState.draftLastSave) }}</span>
      </div>

      <div class="status-item" v-if="syncState.isStatsSyncing">
        <el-icon class="rotating">
          <refresh />
        </el-icon>
        <span>同步数据中...</span>
      </div>
    </div>

    <!-- 表单进度 -->
    <div class="form-progress" v-if="showProgress">
      <el-progress :percentage="formState.progress" :status="formState.isValid ? 'success' : 'exception'"
        :show-text="false" />
      <span class="progress-text">完成度: {{ formState.progress }}%</span>
    </div>

    <!-- 主表单 -->
    <el-form ref="formRef" :model="currentForm" label-width="120px" @submit.prevent="handleSubmit">
      <!-- 问题描述 -->
      <el-form-item label="问题描述" :error="getFieldError('description')" required>
        <el-input v-model="currentForm.description" type="textarea" :rows="6" placeholder="请详细描述您遇到的问题..."
          :maxlength="5000" show-word-limit @blur="() => validateField('description', currentForm.description)"
          @input="handleDescriptionInput" />
      </el-form-item>

      <!-- 联系方式 -->
      <el-form-item label="邮箱" :error="getFieldError('email')">
        <el-input v-model="currentForm.email" placeholder="可选，用于接收处理结果通知"
          @blur="() => validateField('email', currentForm.email)" />
      </el-form-item>

      <el-form-item label="手机号" :error="getFieldError('phone')">
        <el-input v-model="currentForm.phone" placeholder="可选，用于紧急情况联系"
          @blur="() => validateField('phone', currentForm.phone)" />
      </el-form-item>

      <!-- 文件上传 -->
      <el-form-item label="附件">
        <div class="upload-area">
          <el-upload ref="uploadRef" :file-list="fileList" :before-upload="handleBeforeUpload"
            :on-remove="handleFileRemove" :on-exceed="handleExceed" :limit="3" multiple drag action="#"
            :auto-upload="false">
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                支持 jpg/png/gif/mp4 文件，单个文件不超过100MB，最多3个文件
              </div>
            </template>
          </el-upload>

          <!-- 上传进度 -->
          <div v-if="uploadState.hasActiveUploads" class="upload-progress">
            <el-progress :percentage="uploadState.overallProgress"
              :status="uploadState.overallProgress === 100 ? 'success' : undefined" />
            <span>正在上传 {{ uploadState.uploadingFiles.length }} 个文件...</span>
          </div>
        </div>
      </el-form-item>

      <!-- 验证码 -->
      <el-form-item label="验证码" :error="getFieldError('captcha')" required>
        <div class="captcha-container">
          <el-input v-model="currentForm.captcha" placeholder="请输入验证码" style="width: 200px; margin-right: 10px"
            @blur="() => validateField('captcha', currentForm.captcha)" />
          <captcha-input @verified="handleCaptchaVerified" />
        </div>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <div class="form-actions">
          <el-button type="primary" :loading="formState.isSubmitting" :disabled="!formState.canSubmit"
            @click="handleSubmit">
            {{ formState.isSubmitting ? '提交中...' : '提交反馈' }}
          </el-button>

          <el-button @click="handleReset">重置</el-button>

          <el-button v-if="hasDraft" type="info" @click="handleLoadDraft"> 加载草稿 </el-button>

          <el-button v-if="formState.isDirty" type="warning" @click="handleClearDraft">
            清除草稿
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <!-- 提交历史 -->
    <div v-if="showHistory && submissionHistory.length > 0" class="submission-history">
      <h3>提交历史</h3>
      <el-timeline>
        <el-timeline-item v-for="record in submissionHistory.slice(0, 5)" :key="record.id"
          :timestamp="formatDateTime(record.submittedAt)" :type="getStatusType(record.status)">
          <div class="history-item">
            <div class="history-title">{{ record.title }}</div>
            <div class="history-meta">
              <el-tag :type="getStatusType(record.status)" size="small">
                {{ getStatusText(record.status) }}
              </el-tag>
              <span v-if="record.issueId" class="issue-id"> 问题编号: {{ record.issueId }} </span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 统计信息 -->
    <div v-if="showStats && syncedStats" class="stats-panel">
      <h3>反馈统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ syncedStats.stats?.total || 0 }}</div>
          <div class="stat-label">总反馈数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ syncedStats.stats?.recent || 0 }}</div>
          <div class="stat-label">最近反馈</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEnhancedFeedback } from '@/composables/useEnhancedFeedback';
import { Check, Connection, Loading, Refresh, UploadFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, ref } from 'vue';
import CaptchaInput from './CaptchaInput.vue';

// Props
interface Props {
  showStatusBar?: boolean;
  showProgress?: boolean;
  showHistory?: boolean;
  showStats?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showStatusBar: true,
  showProgress: true,
  showHistory: true,
  showStats: false,
});

// 使用增强的反馈功能
const {
  formState,
  uploadState,
  appState,
  syncState,
  currentForm,
  submissionHistory,
  validationErrors,
  syncedStats,
  updateForm,
  resetForm,
  validateField,
  submitFeedback,
  uploadFiles,
  removeFile,
  loadDraft,
  clearDraft,
} = useEnhancedFeedback();

// 模板引用
const formRef = ref();
const uploadRef = ref();

// 计算属性
const fileList = computed(() =>
  currentForm.value.files.map(file => ({
    name: file.name,
    size: file.size,
    uid: file.id,
  }))
);

const hasDraft = computed(() => {
  return localStorage.getItem('feedback_draft') !== null;
});

// 方法
const getFieldError = (field: string) => {
  const errors = validationErrors.value[field];
  return errors && errors.length > 0 ? errors[0] : '';
};

const handleDescriptionInput = (value: string) => {
  updateForm({ description: value });
};

const handleCaptchaVerified = (captchaId: string) => {
  // 验证码验证成功，不需要修改表单中的captcha字段
  // captcha字段应该保持用户输入的验证码值
  console.log('验证码验证成功:', captchaId);
};

const handleBeforeUpload = (file: File) => {
  // 验证文件
  const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'].includes(file.type);
  const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB

  if (!isValidType) {
    ElMessage.error('只支持 JPG、PNG、GIF、MP4 格式的文件');
    return false;
  }

  if (!isValidSize) {
    ElMessage.error('文件大小不能超过 100MB');
    return false;
  }

  // 开始上传
  uploadFiles([file]);
  return false; // 阻止默认上传
};

const handleFileRemove = (file: any) => {
  const fileToRemove = currentForm.value.files.find(f => f.id === file.uid);
  if (fileToRemove) {
    removeFile(fileToRemove.id);
  }
};

const handleExceed = () => {
  ElMessage.warning('最多只能上传 3 个文件');
};

const handleSubmit = async () => {
  const result = await submitFeedback();

  if (result.success) {
    ElMessage.success(`反馈提交成功！问题编号: ${result.issueId}`);
  }
};

const handleReset = () => {
  resetForm();
  ElMessage.success('表单已重置');
};

const handleLoadDraft = () => {
  loadDraft();
};

const handleClearDraft = () => {
  clearDraft();
};

// 工具方法
const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${Math.floor(diff / 86400000)}天前`;
};

const formatDateTime = (date: Date) => {
  return date.toLocaleString('zh-CN');
};

const getStatusType = (status: string) => {
  switch (status) {
    case 'submitted':
      return 'info';
    case 'processing':
      return 'warning';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'info';
    default:
      return 'info';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'submitted':
      return '已提交';
    case 'processing':
      return '处理中';
    case 'resolved':
      return '已解决';
    case 'closed':
      return '已关闭';
    default:
      return status;
  }
};
</script>

<style scoped>
.enhanced-feedback-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.status-bar {
  display: flex;
  gap: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-success {
  color: #67c23a;
}

.text-error {
  color: #f56c6c;
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

.form-progress {
  margin-bottom: 20px;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.upload-area {
  width: 100%;
}

.upload-progress {
  margin-top: 10px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
}

.captcha-container {
  display: flex;
  align-items: center;
}

.form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.submission-history {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.history-item {
  margin-bottom: 10px;
}

.history-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.issue-id {
  font-family: monospace;
}

.stats-panel {
  margin-top: 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}
</style>
