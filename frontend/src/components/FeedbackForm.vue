
<template>
  <el-container>
    <el-header><h1>外部市场问题反馈</h1></el-header>
      <el-form ref="formRef" :model="formData" :rules="rules" @submit.prevent="submitForm" class="mobile-friendly-form">
        <!-- 问题类型 -->
        <el-form-item label="问题类型" prop="issueType" class="mobile-form-item">
          <el-tabs v-model="formData.issueType" class="mobile-tabs">
            <el-tab-pane
              v-for="type in issueTypes"
              :key="type.value"
              :label="type.label"
              :name="type.value">
              <p class="text-xs text-gray-500 mt-1">{{ type.description }}</p>
            </el-tab-pane>
          </el-tabs>
        </el-form-item>

        <!-- 问题描述 -->
        <el-form-item label="问题描述" prop="description" class="mobile-form-item">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="10"
            :maxlength="1000"
            show-word-limit
            :placeholder="descriptionPlaceholder"
            class="mobile-input"
          />
        </el-form-item>

        <!-- 联系方式 -->
        <el-form-item label="联系方式" prop="contactInfo" class="mobile-form-item">
          <el-input
            v-model="formData.contactInfo"
            type="textarea"
            :rows="5"
            :maxlength="100"
            show-word-limit
            placeholder="请输入手机号码、电子邮件及互生号等可以联系到您的方式"
            class="mobile-input"
          />
        </el-form-item>

        <!-- 截图和录屏 -->
        <el-form-item label="截图和录屏" prop="files">
          <el-upload
            ref="fileInput"
            multiple
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-drop="handleFileDrop"
            :limit="3"
            accept=".jpg,.jpeg,.png,.gif,.mkv,.mp4"
            class="el-upload-dragger"
          >
            <p class="el-upload__text">将文件拖到此处，或<em>点击上传</em></p>
            <p class="el-upload__tip text-xs">支持 .jpg、.png、.gif、.mkv 或 mp4 格式，最多3个文件</p>
          </el-upload>
        </el-form-item>

        <!-- 附加信息复选框
        <el-form-item>
          <p class="text-sm text-gray-600 mb-2">以下信息仅用于问题排查，复现和解决：</p>
          <el-checkbox-group v-model="formData.selectedOptions">
            <el-checkbox value="includeSystemInfo">系统信息</el-checkbox>
            <el-checkbox value="includeDeviceInfo">描述信息</el-checkbox>
            <el-checkbox value="includeAppLogs">应用日志</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        -->
        <!-- 数字验证码 -->
        <el-form-item label="验证码" prop="captcha">
          <el-input
            v-model="formData.captcha"
            placeholder="请输入图片中的数字"
            inputmode="numeric"
            pattern="[0-9]*"
            class="w-10"
          >
            <template #append>
              <el-button
                type="primary"
                class="flex-shrink-0 w-32 h-10 rounded"
                @click="refreshCaptcha"
              >
                <img v-if="captchaUrl" :src="captchaUrl" alt="数字验证码" class="h-full w-full object-cover rounded" />
                <span v-else class="text-gray-500 text-xs">加载中...</span>
              </el-button>
            </template>
          </el-input>
          <p class="text-xs text-gray-500 mt-1">请输入图片中显示的数字</p>
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item class="flex items-center justify-end mt-8">
          <el-button
            type="primary"
            :loading="isSubmitting"
            @click="submitForm"
          >
            {{ isSubmitting ? '提交中...' : '提交报告' }}
          </el-button>
          <el-button
            class="ml-4"
            @click="resetForm"
          >
            重置表单
          </el-button>
        </el-form-item>

        <!-- 结果反馈 -->
        <div v-if="submitResult" class="mt-6 p-4 rounded-md text-center" :class="submitResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          {{ submitResult.message }}
          <span v-if="submitResult.issueId"> 问题单号: #{{ submitResult.issueId }}</span>
        </div>
      </el-form>

  </el-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';
import type { FormInstance } from 'element-plus';

interface FormData {
  issueType: string;
  description: string;
  contactInfo: string;
  files: File[];
  includeSystemInfo: boolean;
  includeDeviceInfo: boolean;
  includeAppLogs: boolean;
  captcha: string;
  captchaId: string;
}

interface SubmitResult {
  success: boolean;
  message: string;
  issueId?: number;
}

const issueTypes = [
  { 
    label: '提交Bug', 
    value: 'bug',
    description: '报告使用中的问题，如遇到Bug等'
  },
  { 
    label: '我要吐槽', 
    value: 'complain',
    description: '分享您对我们功能的看法'
  },
  { 
    label: '我有好想法', 
    value: 'idea',
    description: '提议新功能或改进现有功能'
  },
];

const formRef = ref<FormInstance | null>(null);
const uploadFiles = ref<File[]>([]);
const formData = reactive<FormData>({
  issueType: '提交Bug', // 默认值
  description: '',
  contactInfo: '',
  files: uploadFiles.value, // 使用响应式ref存储文件列表
  includeSystemInfo: false,
  includeDeviceInfo: false,
  includeAppLogs: false,
  captcha: '',
  captchaId: ''
});

const isSubmitting = ref(false);
const submitResult = ref<SubmitResult | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const captchaUrl = ref<string>('');

const descriptionPlaceholder = computed(() => {
  switch (formData.issueType) {
    case 'bug':
      return '[问题描述]:\n[复现步骤]:\n[预期结果]:\n[实际结果]:\n';
    case 'complain':
      return '和AI对话相关反馈，最好可以站在信息交流角度';
    case 'idea':
      return '提议新功能或者改进现有功能';
    default:
      return '请输入问题描述';
  }
});

const validateFiles = (_rule: any, value: File[], callback: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/x-matroska'];
  const invalidFiles = value.filter(file => !allowedTypes.includes(file.type));
  if (invalidFiles.length > 0) {
    callback(new Error(`文件 ${invalidFiles.map(f => f.name).join(', ')} 类型不允许. 只支持 jpg, png, gif, mkv, mp4.`));
    return;
  }
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const oversizedFiles = value.filter(file => file.size > MAX_FILE_SIZE);
  if (oversizedFiles.length > 0) {
    callback(new Error(`文件 ${oversizedFiles.map(f => f.name).join(', ')} 大小超过100MB限制.`));
    return;
  }
  if (value.length > 3) {
    callback(new Error('最多只能上传3个文件.'));
    return;
  }
  callback();
};

const rules = {
  issueType: [
    { required: true, message: '请选择问题类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d+$/, message: '验证码只能包含数字', trigger: 'blur' }
  ],
  files: [
    { validator: validateFiles, trigger: 'change' }
  ]
};

onMounted(() => {
  refreshCaptcha();
});

const refreshCaptcha = async () => {
  try {
    captchaUrl.value = '';
    // 明确请求数字验证码
    const response = await axios.get('/api/captcha/generate', {
      params: {
        type: 'numeric', // 指定获取数字验证码
        length: 6 // 指定验证码长度为6位数字
      }
    });

    // 直接从response.data中获取数据
    const { imageUrl, captchaId } = response.data;
    captchaUrl.value = imageUrl;
    formData.captchaId = captchaId;
  } catch (error: any) {
    console.error('获取数字验证码失败:', error);
    captchaUrl.value = '';
    // 显示详细的错误信息
    submitResult.value = { 
      success: false, 
      message: `获取验证码失败：${error.message || '请刷新验证码重试'}`
    };
  }
};

const submitForm = async () => {
  isSubmitting.value = true;
  try {
    // 验证表单所有字段（包括验证码）
    const valid = await new Promise<boolean>((resolve) => {
      formRef.value?.validate((valid) => resolve(valid));
    });
    // 额外验证验证码格式（确保前端校验生效）
    if (formData.captcha && !/^\d+$/.test(formData.captcha)) {
      submitResult.value = { success: false, message: '验证码只能包含数字' };
      isSubmitting.value = false;
      return;
    }
    if (!valid) {
      isSubmitting.value = false;
      return;
    }
    const formDataToSend = new FormData();
    // 添加表单字段，正确解构出 key 和 value
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'files') {
        if (typeof value === 'boolean') {
          value = value ? 'true' : 'false'; // 将布尔值转换为字符串
        }
        if (value !== undefined && value !== null && value !== '') {
          // 处理value类型，确保为string或Blob
          if (value instanceof File) {
            formDataToSend.append(key, value);
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      }
    });
    // 添加文件（使用ref的value访问响应式数组）
    formData.files.forEach(file => {
      formDataToSend.append('files', file);
    });
    // 移除手动设置的 Content-Type，让 Axios 自动处理
    const response = await axios.post('/api/submit', formDataToSend);
    submitResult.value = response.data;
  } catch (error: any) {
    console.error('提交失败:', error);
    const errorMessage = error.response?.data?.message || error.message || '请稍后重试';
    submitResult.value = {
      success: false,
      message: `提交失败：${errorMessage}`
    };
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  formData.issueType = '提交Bug';
  formData.description = '';
  formData.contactInfo = '';
  formData.files = [];
  formData.includeSystemInfo = true;
  formData.includeDeviceInfo = true;
  formData.includeAppLogs = true;
  formData.captcha = '';
  refreshCaptcha();
};

const handleFileChange = (fileList: any) => {
  // 从el-upload的fileList中提取原始文件对象
  uploadFiles.value = fileList.map((item: any) => item.raw);
  // 使用 validateField 处理验证错误
  if (formRef.value) {
    formRef.value.validateField('files', (errors) => {
      if (errors) {
        formRef.value?.clearValidate('files');
      }
    });
  }
};

const handleFileDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
  // 使用 validateField 处理验证错误
  if (formRef.value) {
    formRef.value.validateField('files', (errors) => {
      if (errors) {
        formRef.value?.clearValidate('files');
      }
    });
  }
};

const addFiles = (newFiles: File[]) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/x-matroska'];
  const validFiles = newFiles.filter(file => allowedTypes.includes(file.type));
  // 使用splice触发响应式更新
  formData.files.splice(formData.files.length, 0, ...validFiles);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 5MB
  const oversizedFiles = validFiles.filter(file => file.size > MAX_FILE_SIZE);


  if (oversizedFiles.length > 0) {
    if (formRef.value) {
      if (formRef.value) {
        formRef.value.validateField('files', () => {
          formRef.value?.clearValidate('files');
          formRef.value?.validateField('files', (errors) => {
            if (!errors) {
              formRef.value?.validateField('files', (errors) => {
                if (errors) {
                  formRef.value?.clearValidate('files');
                }
                formRef.value?.validateField('files', () => {
                  formRef.value?.validateField('files', (errors) => {
                    if (errors) {
                      formRef.value?.clearValidate('files');
                    }
                  });
                });
              });
            }
          });
        });
      }

    }
  }

  const totalFiles = formData.files.length;
  if (totalFiles > 3) {
    // 只添加允许数量的文件
    const remainingSlots = 3 - formData.files.length;
    if (remainingSlots > 0) {
      formData.files.push(...validFiles.slice(0, remainingSlots));
    }
  } else {
    formData.files.push(...validFiles);
    if (formRef.value) {
      formRef.value.validateField('files', (errors) => {
        if (!errors) {
          formRef.value?.clearValidate('files');
        }
      });
    }
  }
/**
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
 */
}

</script>


<style scoped>
/* 添加一些额外的 scoped 样式，可以在这里添加 */
.mobile-friendly-form {
  padding: 10px; /* 为表单添加内边距 */
}

.mobile-form-item {
  margin-bottom: 15px; /* 调整表单项间距 */
}



.mobile-input {
  width: 100%; /* 输入框宽度占满容器 */
}

@media (max-width: 768px) {
  /* 无使用的.el-form-item__label选择器已移除 */
}
</style>