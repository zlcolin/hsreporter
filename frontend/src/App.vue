
<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-2 sm:p-4">
    <div class="bg-white p-4 sm:p-8 rounded-xl shadow-lg w-full max-w-2xl border border-gray-100">
      <div class="flex justify-between items-center mb-6 sm:mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">报告问题</h1>
      </div>

      <form @submit.prevent="submitForm">
        <!-- 问题类型 -->
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">问题类型 <span class="text-red-500">*</span></label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div 
              v-for="type in issueTypes" 
              :key="type.value"
              class="border-2 rounded-lg p-3 sm:p-5 cursor-pointer transition-all duration-200 hover:shadow-md"
              :class="formData.issueType === type.value ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-gray-200 hover:border-blue-300'"
              @click="formData.issueType = type.value"
            >
              <div class="flex items-start">
                <input 
                  type="radio" 
                  :id="type.value" 
                  :value="type.value" 
                  v-model="formData.issueType"
                  class="mt-1"
                />
                <div class="ml-2">
                  <label :for="type.value" class="block text-sm font-medium text-gray-700">{{ type.label }}</label>
                  <p class="text-xs text-gray-500 mt-1">{{ type.description }}</p>
                </div>
              </div>
            </div>
          </div>
          <p v-if="errors.issueType" class="text-red-500 text-xs mt-1">{{ errors.issueType }}</p>
        </div>

        <!-- 问题描述 -->
        <div class="mb-6">
          <label for="description" class="block text-gray-700 text-sm font-bold mb-2">描述 <span class="text-red-500">*</span></label>
          <div class="relative">
            <textarea
              id="description"
              v-model="formData.description"
              rows="6"
              class="shadow-sm appearance-none border-2 rounded-lg w-full py-3 px-4 text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 ease-in-out"
              :placeholder="descriptionPlaceholder"
            ></textarea>
            <div class="absolute bottom-2 right-2 text-xs text-gray-500">
              {{ formData.description.length }}/1000
            </div>
          </div>
          <p v-if="errors.description" class="text-red-500 text-xs mt-1">{{ errors.description }}</p>
        </div>

        <!-- 联系方式 -->
        <div class="mb-6">
          <label for="contact" class="block text-gray-700 text-sm font-bold mb-2">联系方式</label>
          <input
            type="text"
            id="contact"
            v-model="formData.contactInfo"
            class="shadow-sm appearance-none border-2 rounded-lg w-full py-3 px-4 text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 ease-in-out"
            placeholder="电子邮件，手机号码及互生号等可以联系到您的方式"
          />
          <p v-if="errors.contactInfo" class="text-red-500 text-xs mt-1">{{ errors.contactInfo }}</p>
        </div>

        <!-- 截图和录屏 -->
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">截图和录屏</label>
          <div
            @dragover.prevent
            @dragenter.prevent
            @drop.prevent="handleFileDrop"
            class="border-3 border-dashed border-gray-200 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 group"
            @click="triggerFileInput"
          >
            <input
              type="file"
              ref="fileInput"
              multiple
              @change="handleFileChange"
              class="hidden"
              accept=".jpg,.jpeg,.png,.gif,.mkv,.mp4"
            />
            <div class="flex flex-col items-center justify-center py-4">
              <div class="text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                <p class="text-xs text-center group-hover:text-blue-400">【支持 .jpg、.png、.gif、.mkv 或 mp4 格式，最多3个文件】</p>
              </div>
            </div>
          </div>
          <div v-if="formData.files.length > 0" class="mt-4 space-y-2">
            <ul>
              <li v-for="(file, index) in formData.files" :key="index" class="flex justify-between items-center text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                <button type="button" @click="removeFile(index)" class="text-gray-400 hover:text-red-500 rounded-full p-1 hover:bg-red-50 transition-all duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-0.5 w-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
              </li>
            </ul>
          </div>
          <p v-if="errors.files" class="text-red-500 text-xs mt-1">{{ errors.files }}</p>
        </div>

        <!-- 附加信息复选框 -->
        <div class="mb-6">
          <p class="text-sm text-gray-600 mb-2">以下信息仅用于问题排查，复现和解决：</p>
          <div class="flex flex-wrap gap-4 sm:flex-nowrap sm:space-x-6">
            <div class="flex items-center">
              <input type="checkbox" id="systemInfo" v-model="formData.includeSystemInfo" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition duration-200" />
              <label for="systemInfo" class="text-sm text-gray-700 ml-2 select-none hover:text-blue-600 transition-colors duration-200">系统信息</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="deviceInfo" v-model="formData.includeDeviceInfo" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition duration-200" />
              <label for="deviceInfo" class="text-sm text-gray-700 ml-2 select-none hover:text-blue-600 transition-colors duration-200">描述信息</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="appLogs" v-model="formData.includeAppLogs" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition duration-200" />
              <label for="appLogs" class="text-sm text-gray-700 ml-2 select-none hover:text-blue-600 transition-colors duration-200">应用日志</label>
            </div>
          </div>
        </div>

        <!-- 数字验证码 -->
        <div class="mb-6">
          <label for="captcha" class="block text-gray-700 text-sm font-bold mb-2">数字验证码 <span class="text-red-500">*</span></label>
          <div class="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <div class="flex-grow">
              <input
                type="text"
                id="captcha"
                v-model="formData.captcha"
                class="shadow-sm appearance-none border-2 rounded-lg w-full py-3 px-4 text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 ease-in-out"
                placeholder="请输入图片中的数字"
                inputmode="numeric"
                pattern="[0-9]*"
              />
            </div>
            <div class="flex-shrink-0 w-32 h-10 bg-gray-200 rounded flex items-center justify-center cursor-pointer" @click="refreshCaptcha">
              <img v-if="captchaUrl" :src="captchaUrl" alt="数字验证码" class="h-full w-full object-cover rounded" />
              <div v-else class="text-gray-500 text-xs">加载中...</div>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-1">请输入图片中显示的数字</p>
          <p v-if="errors.captcha" class="text-red-500 text-xs mt-1">{{ errors.captcha }}</p>
        </div>

        <!-- 提交按钮 -->
        <div class="flex items-center justify-end mt-8">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 sm:px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {{ isSubmitting ? '提交中...' : '提交报告' }}
          </button>
        </div>

        <!-- 结果反馈 -->
        <div v-if="submitResult" class="mt-6 p-4 rounded-md text-center" :class="submitResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
          {{ submitResult.message }}
          <span v-if="submitResult.issueId"> 问题单号: #{{ submitResult.issueId }}</span>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';

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

interface Errors {
  issueType?: string;
  description?: string;
  contactInfo?: string;
  files?: string;
  captcha?: string;
}

const issueTypes = [
  { 
    label: '提交Bug', 
    value: '提交Bug',
    description: '报告软件中的问题，如遇到Bug类的问题，可先查阅官方FAQ文档'
  },
  { 
    label: '我要吐槽', 
    value: '我要吐槽',
    description: '分享您对我们功能的看法'
  },
  { 
    label: '我有好想法', 
    value: '我有好想法',
    description: '提议新功能或改进现有功能'
  },
];

const formData = reactive<FormData>({
  issueType: '提交Bug', // 默认值
  description: '',
  contactInfo: '',
  files: [],
  includeSystemInfo: true,
  includeDeviceInfo: true,
  includeAppLogs: true,
  captcha: '',
  captchaId: ''
});

const errors = reactive<Errors>({});
const isSubmitting = ref(false);
const submitResult = ref<SubmitResult | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const captchaUrl = ref<string>('');

const descriptionPlaceholder = computed(() => {
  switch (formData.issueType) {
    case '提交 Bug':
      return '[问题描述]:\n[复现步骤]:\n[预期结果]:\n[实际结果]:\n';
    case '我要吐槽':
      return '和AI对话相关反馈，最好可以站在信息交流角度';
    case '我有好想法':
      return '提议新功能或者改进现有功能';
    default:
      return '请输入问题描述';
  }
});

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
    
    // 检查响应数据的结构
    if (!response.data) {
      throw new Error('服务器响应数据为空');
    }
    
    // 直接从response.data中获取数据
    const { imageUrl, captchaId } = response.data;
    if (!imageUrl) {
      throw new Error('响应数据格式错误：缺少imageUrl');
    }
    if (!captchaId) {
      throw new Error('响应数据格式错误：缺少captchaId');
    }
    
    captchaUrl.value = imageUrl;
    formData.captchaId = captchaId;
  } catch (error: any) {
    console.error('获取数字验证码失败:', error);
    captchaUrl.value = '';
    // 显示详细的错误信息
    submitResult.value = { 
      success: false, 
      message: `获取验证码失败：${error.message || '请稍后重试'}` 
    };
  }
};

const validateForm = (): boolean => {
  // 清空之前的错误
  Object.keys(errors).forEach(key => delete errors[key as keyof Errors]);
  let isValid = true;

  if (!formData.issueType) {
    errors.issueType = '请选择问题类型';
    isValid = false;
  }
  if (!formData.description.trim()) {
    errors.description = '请输入问题描述';
    isValid = false;
  }
  if (!formData.captcha.trim()) {
    errors.captcha = '请输入验证码';
    isValid = false;
  } else if (!/^\d+$/.test(formData.captcha.trim())) {
    errors.captcha = '验证码只能包含数字';
    isValid = false;
  } else if (!/^\d+$/.test(formData.captcha.trim())) {
    errors.captcha = '验证码只能包含数字';
    isValid = false;
  }

  if (formData.files.length > 3) {
    errors.files = '最多只能上传3个文件';
    isValid = false;
  }

  // 文件大小和类型验证
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/x-matroska'];
  const maxSize = 100 * 1024 * 1024; // 100MB
  for (const file of formData.files) {
    if (!allowedTypes.includes(file.type)) {
        errors.files = `文件 ${file.name} 类型不允许. 只支持 jpg, png, gif, mkv, mp4.`;
        isValid = false;
        break;
    }
    if (file.size > maxSize) {
        errors.files = `文件 ${file.name} 太大 (最大 ${formatFileSize(maxSize)}).`;
        isValid = false;
        break;
    }
  }

  return isValid;
};

const submitForm = async () => {
  submitResult.value = null; // 清除旧结果
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;
  const data = new FormData();
  data.append('issueType', formData.issueType);
  data.append('description', formData.description);
  data.append('contactInfo', formData.contactInfo);
  data.append('includeSystemInfo', formData.includeSystemInfo.toString());
  data.append('includeDeviceInfo', formData.includeDeviceInfo.toString());
  data.append('includeAppLogs', formData.includeAppLogs.toString());
  data.append('captcha', formData.captcha);
  data.append('captchaId', formData.captchaId);
  
  formData.files.forEach((file) => {
    data.append('files', file);
  });

  try {
    const response = await axios.post('/api/submit', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    submitResult.value = { success: true, message: response.data.message, issueId: response.data.issueId };
    // 提交成功后清空表单
    resetForm();
  } catch (error: any) {
    console.error('Submission error:', error);
    let message = '提交失败，请稍后重试。';
    if (error.response && error.response.data && error.response.data.message) {
      message = `提交失败: ${error.response.data.message}`;
    }
    // 如果是验证码错误，刷新验证码
    if (error.response && error.response.status === 400 && error.response.data.code === 'INVALID_CAPTCHA') {
      refreshCaptcha();
      errors.captcha = '数字验证码错误，请重新输入';
    }
    submitResult.value = { success: false, message };
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

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    addFiles(Array.from(target.files));
  }
  // 清空 input 的值，以便可以再次选择相同的文件
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleFileDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
};

const addFiles = (newFiles: File[]) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/x-matroska'];
  const validFiles = newFiles.filter(file => allowedTypes.includes(file.type));
  const invalidFiles = newFiles.filter(file => !allowedTypes.includes(file.type));

  if (invalidFiles.length > 0) {
      errors.files = `文件 ${invalidFiles.map(f => f.name).join(', ')} 类型不允许. 只支持 jpg, png, gif, mkv, mp4.`;
  } else {
      delete errors.files; // 清除之前的类型错误
  }

  const totalFiles = formData.files.length + validFiles.length;
  if (totalFiles > 3) {
    errors.files = '最多只能上传3个文件';
    // 只添加允许数量的文件
    const remainingSlots = 3 - formData.files.length;
    if (remainingSlots > 0) {
        formData.files.push(...validFiles.slice(0, remainingSlots));
    }
  } else {
    formData.files.push(...validFiles);
    // 如果之前有数量错误，现在数量合法了，清除错误
    if (errors.files === '最多只能上传3个文件') {
        delete errors.files;
    }
  }
};

const removeFile = (index: number) => {
  formData.files.splice(index, 1);
  // 如果移除文件后数量合法，清除数量错误
  if (formData.files.length <= 3 && errors.files === '最多只能上传3个文件') {
      delete errors.files;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
/* 添加一些额外的 scoped 样式，可以在这里添加 */
</style>
