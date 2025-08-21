<template>
  <div class="enhanced-upload">
    <div
      ref="dropZone"
      class="upload-area"
      :class="{
        'is-dragover': isDragOver,
        'has-files': fileList.length > 0,
        'is-disabled': disabled,
      }"
      @click="triggerFileInput"
    >
      <!-- Drag and Drop Zone -->
      <div v-if="fileList.length === 0" class="upload-placeholder">
        <el-icon class="upload-icon" size="48">
          <upload />
        </el-icon>
        <div class="upload-text">
          <p class="primary-text">点击上传文件或拖拽文件到此区域</p>
          <p class="secondary-text">
            支持 {{ allowedTypesText }}，单个文件最大 {{ maxSizeMB }}MB，最多 {{ maxFiles }} 个文件
          </p>
        </div>
      </div>

      <!-- File List -->
      <div v-else class="file-list">
        <div
          v-for="(file, index) in fileList"
          :key="file.uid"
          class="file-item"
          :class="{ 'upload-error': file.status === 'fail' }"
        >
          <div class="file-info">
            <el-icon class="file-icon">
              <document v-if="isDocument(file)" />
              <picture v-else-if="isImage(file)" />
              <video-play v-else-if="isVideo(file)" />
              <document v-else />
            </el-icon>
            <div class="file-details">
              <div class="file-name" :title="file.name">{{ file.name }}</div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span
                  v-if="file.compressionRatio && file.compressionRatio > 0"
                  class="compression-info"
                >
                  (压缩率: {{ Math.round(file.compressionRatio * 100) }}%)
                </span>
              </div>
            </div>
          </div>

          <!-- Upload Progress -->
          <div v-if="file.status === 'uploading'" class="upload-progress">
            <el-progress :percentage="file.percentage || 0" :stroke-width="4" :show-text="false" />
          </div>

          <!-- Upload Status -->
          <div class="file-actions">
            <el-icon v-if="file.status === 'success'" class="status-icon success" size="16">
              <check />
            </el-icon>
            <el-icon v-else-if="file.status === 'fail'" class="status-icon error" size="16">
              <close />
            </el-icon>
            <el-button
              v-if="!disabled"
              type="danger"
              size="small"
              text
              @click.stop="removeFile(index)"
            >
              <el-icon>
                <delete />
              </el-icon>
            </el-button>
          </div>
        </div>

        <!-- Add More Files Button -->
        <div v-if="fileList.length < maxFiles && !disabled" class="add-more">
          <el-button type="primary" plain @click.stop="triggerFileInput">
            <el-icon>
              <plus />
            </el-icon>
            添加更多文件
          </el-button>
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      :multiple="multiple"
      :accept="accept"
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- Upload Tips -->
    <div v-if="showTips" class="upload-tips">
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        :closable="false"
        show-icon
      />
      <div v-else class="tips-content">
        <el-icon><info-filled /></el-icon>
        <span>{{ tipsText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Check,
  Close,
  Delete,
  Document,
  InfoFilled,
  Plus,
  Upload,
  VideoPlay,
} from '@element-plus/icons-vue';
import { useDropZone } from '@vueuse/core';
import { ElMessage } from 'element-plus';
import { computed, ref, watch } from 'vue';

interface FileItem {
  uid: string;
  name: string;
  size: number;
  status: 'ready' | 'uploading' | 'success' | 'fail';
  percentage?: number;
  raw: File;
  response?: any;
  compressionRatio?: number;
}

interface Props {
  modelValue?: FileItem[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  autoUpload?: boolean;
  showTips?: boolean;
  allowedTypes?: string[];
}

interface Emits {
  (e: 'update:modelValue', files: FileItem[]): void;
  (e: 'change', files: FileItem[]): void;
  (e: 'exceed', files: File[], fileList: FileItem[]): void;
  (e: 'before-upload', file: File): boolean | Promise<boolean>;
  (e: 'upload-progress', event: ProgressEvent, file: FileItem): void;
  (e: 'upload-success', response: any, file: FileItem): void;
  (e: 'upload-error', error: Error, file: FileItem): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxFiles: 3,
  maxSize: 100 * 1024 * 1024, // 100MB
  accept: '.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi,.wmv,.pdf,.txt,.doc,.docx',
  multiple: true,
  disabled: false,
  autoUpload: false,
  showTips: true,
  allowedTypes: () => [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
});

const emit = defineEmits<Emits>();

const dropZone = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();
const fileList = ref<FileItem[]>(props.modelValue || []);
const errorMessage = ref('');

// Computed properties
const maxSizeMB = computed(() => Math.round(props.maxSize / 1024 / 1024));
const allowedTypesText = computed(() => {
  const extensions = props.accept.split(',').map(ext => ext.trim().replace('.', ''));
  return extensions.join('、').toUpperCase();
});

const tipsText = computed(() => {
  return `支持 ${allowedTypesText.value} 格式，单个文件最大 ${maxSizeMB.value}MB，最多 ${props.maxFiles} 个文件`;
});

// Watch for external changes
watch(
  () => props.modelValue,
  newValue => {
    fileList.value = newValue || [];
  },
  { deep: true }
);

// File type checking functions
const isImage = (file: FileItem) => file.raw.type.startsWith('image/');
const isVideo = (file: FileItem) => file.raw.type.startsWith('video/');
const isDocument = (file: FileItem) =>
  file.raw.type.includes('pdf') ||
  file.raw.type.includes('document') ||
  file.raw.type.includes('text');

// File size formatting
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Generate unique ID
const generateUID = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Validate file
const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > props.maxSize) {
    return {
      valid: false,
      error: `文件 "${file.name}" 大小超出限制，最大允许 ${maxSizeMB.value}MB`,
    };
  }

  // Check file type
  if (props.allowedTypes.length > 0 && !props.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `文件 "${file.name}" 类型不支持，仅支持 ${allowedTypesText.value} 格式`,
    };
  }

  // Check filename for security
  if (file.name.includes('..') || /[<>:"/\\|?*]/.test(file.name)) {
    return {
      valid: false,
      error: `文件名 "${file.name}" 包含非法字符`,
    };
  }

  return { valid: true };
};

// Handle file selection
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  processFiles(files);
  // Clear input to allow selecting the same file again
  target.value = '';
};

// Handle file drop
const handleFileDrop = (files: File[] | null) => {
  if (!files || props.disabled) return;
  processFiles(files);
};

// Drag and drop functionality (initialized after handleFileDrop is defined)
const { isOverDropZone: isDragOver } = useDropZone(dropZone, {
  onDrop: handleFileDrop,
  dataTypes: ['Files'],
});

// Process selected files
const processFiles = (files: File[]) => {
  errorMessage.value = '';

  // Check file count limit
  const totalFiles = fileList.value.length + files.length;
  if (totalFiles > props.maxFiles) {
    emit('exceed', files, fileList.value);
    ElMessage.warning(`最多只能上传 ${props.maxFiles} 个文件`);
    return;
  }

  const validFiles: FileItem[] = [];

  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      errorMessage.value = validation.error || '文件验证失败';
      ElMessage.error(validation.error || '文件验证失败');
      continue;
    }

    const fileItem: FileItem = {
      uid: generateUID(),
      name: file.name,
      size: file.size,
      status: 'ready',
      raw: file,
    };

    validFiles.push(fileItem);
  }

  if (validFiles.length > 0) {
    fileList.value.push(...validFiles);
    updateModelValue();
    emit('change', fileList.value);

    if (props.autoUpload) {
      validFiles.forEach(uploadFile);
    }
  }
};

// Upload single file
const uploadFile = async (file: FileItem) => {
  try {
    // Call before-upload hook
    const beforeUploadResult = await emit('before-upload', file.raw);
    if (beforeUploadResult === false) {
      return;
    }

    file.status = 'uploading';
    file.percentage = 0;

    // Create FormData
    const formData = new FormData();
    formData.append('files', file.raw);

    // Simulate upload progress (replace with actual upload logic)
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        file.percentage = Math.round((event.loaded / event.total) * 100);
        emit('upload-progress', event, file);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        file.status = 'success';
        file.response = response;
        if (response.data?.files?.[0]?.compressionRatio) {
          file.compressionRatio = response.data.files[0].compressionRatio;
        }
        emit('upload-success', response, file);
      } else {
        throw new Error(`Upload failed with status ${xhr.status}`);
      }
    });

    xhr.addEventListener('error', () => {
      throw new Error('Upload failed');
    });

    xhr.open('POST', '/api/v1/upload');
    xhr.send(formData);
  } catch (error) {
    file.status = 'fail';
    file.percentage = 0;
    emit('upload-error', error as Error, file);
    ElMessage.error(`文件 "${file.name}" 上传失败`);
  }
};

// Remove file
const removeFile = (index: number) => {
  fileList.value.splice(index, 1);
  updateModelValue();
  emit('change', fileList.value);
  errorMessage.value = '';
};

// Trigger file input
const triggerFileInput = () => {
  if (!props.disabled && fileInput.value) {
    fileInput.value.click();
  }
};

// Update model value
const updateModelValue = () => {
  emit('update:modelValue', fileList.value);
};

// Expose methods
defineExpose({
  uploadFiles: () => {
    fileList.value.filter(file => file.status === 'ready').forEach(uploadFile);
  },
  clearFiles: () => {
    fileList.value = [];
    updateModelValue();
    emit('change', fileList.value);
  },
});
</script>

<style scoped>
.enhanced-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.upload-area:hover:not(.is-disabled) {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.upload-area.is-dragover {
  border-color: #409eff;
  background-color: #e6f7ff;
  transform: scale(1.02);
}

.upload-area.has-files {
  min-height: auto;
  padding: 16px;
  align-items: stretch;
}

.upload-area.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-placeholder {
  text-align: center;
  padding: 20px;
}

.upload-icon {
  color: #8c939d;
  margin-bottom: 16px;
}

.upload-text .primary-text {
  font-size: 16px;
  color: #606266;
  margin: 0 0 8px 0;
}

.upload-text .secondary-text {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.file-list {
  width: 100%;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 8px;
  background-color: white;
  transition: all 0.3s ease;
}

.file-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.file-item.upload-error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.file-icon {
  color: #409eff;
  margin-right: 12px;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.file-meta {
  font-size: 12px;
  color: #909399;
}

.compression-info {
  color: #67c23a;
  font-weight: 500;
}

.upload-progress {
  margin: 8px 16px 0 0;
  width: 100px;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.error {
  color: #f56c6c;
}

.add-more {
  text-align: center;
  padding: 12px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background-color: #fafafa;
}

.upload-tips {
  margin-top: 12px;
}

.tips-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #909399;
}

.tips-content .el-icon {
  color: #409eff;
}
</style>
