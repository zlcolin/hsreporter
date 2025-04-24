<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
      <h1 class="text-2xl font-bold mb-6 text-center text-gray-700">市场问题反馈</h1>

      <form @submit.prevent="submitForm">
        <!-- 问题类型 -->
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">问题类型 <span class="text-red-500">*</span></label>
          <div class="flex space-x-4">
            <button
              type="button"
              v-for="type in issueTypes"
              :key="type.value"
              @click="formData.issueType = type.value"
              :class="['px-4 py-2 rounded-md transition-colors duration-200', formData.issueType === type.value ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']"
            >
              {{ type.label }}
            </button>
          </div>
          <p v-if="errors.issueType" class="text-red-500 text-xs mt-1">{{ errors.issueType }}</p>
        </div>

        <!-- 问题描述 -->
        <div class="mb-6">
          <label for="description" class="block text-gray-700 text-sm font-bold mb-2">问题描述 <span class="text-red-500">*</span></label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="6"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :placeholder="descriptionPlaceholder"
          ></textarea>
          <p v-if="errors.description" class="text-red-500 text-xs mt-1">{{ errors.description }}</p>
        </div>

        <!-- 联系方式 -->
        <div class="mb-6 flex space-x-4">
          <!-- 互生号 -->
          <div class="w-1/2">
            <label for="contactHsId" class="block text-gray-700 text-sm font-bold mb-2">互生号</label>
            <input
              type="text"
              id="contactHsId"
              v-model="formData.contactHsId"
              maxlength="11"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="11位数字"
            />
            <p v-if="errors.contactHsId" class="text-red-500 text-xs mt-1">{{ errors.contactHsId }}</p>
          </div>
          <!-- 电话号码 -->
          <div class="w-1/2">
            <label for="contactPhone" class="block text-gray-700 text-sm font-bold mb-2">电话号码</label>
            <input
              type="text"
              id="contactPhone"
              v-model="formData.contactPhone"
              maxlength="11"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="11位数字"
            />
             <p v-if="errors.contactPhone" class="text-red-500 text-xs mt-1">{{ errors.contactPhone }}</p>
          </div>
        </div>

        <!-- 验证码 -->
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">验证码 <span class="text-red-500">*</span></label>
          <div class="flex items-center space-x-4">
            <div class="flex-1">
              <input
                type="text"
                v-model="captchaInput"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入计算结果"
              />
              <p v-if="errors.captcha" class="text-red-500 text-xs mt-1">{{ errors.captcha }}</p>
            </div>
            <div class="bg-gray-200 px-4 py-2 rounded-md text-gray-700 font-medium">
              {{ captchaQuestion }}
            </div>
            <button 
              type="button" 
              @click="generateCaptcha"
              class="text-blue-500 hover:text-blue-700 text-sm"
            >
              换一个
            </button>
          </div>
        </div>

        <!-- 文件上传 -->
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2">上传截图/录屏 (最多3个, 支持jpg, png, gif, mkv, mp4)</label>
          <div
            @dragover.prevent
            @dragenter.prevent
            @drop.prevent="handleFileDrop"
            class="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-blue-500 transition-colors duration-200"
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
            <p class="text-gray-500">拖拽文件到此处，或点击选择文件</p>
          </div>
          <div v-if="formData.files.length > 0" class="mt-4 space-y-2">
            <p class="text-sm font-semibold text-gray-700">已选择文件:</p>
            <ul>
              <li v-for="(file, index) in formData.files" :key="index" class="flex justify-between items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                <button type="button" @click="removeFile(index)" class="text-red-500 hover:text-red-700 font-bold text-lg">&times;</button>
              </li>
            </ul>
          </div>
          <p v-if="errors.files" class="text-red-500 text-xs mt-1">{{ errors.files }}</p>
        </div>

        <!-- 提交按钮 -->
        <div class="flex items-center justify-center mt-8">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? '提交中...' : '提交' }}
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
  contactEmail: string;
  contactHsId: string;
  contactPhone: string;
  files: File[];
}

interface SubmitResult {
  success: boolean;
  message: string;
  issueId?: number;
}

interface Errors {
  issueType?: string;
  description?: string;
  contactHsId?: string;
  contactPhone?: string;
  files?: string;
  captcha?: string;
}

const issueTypes = [
  { label: '提交 Bug', value: '提交 Bug' },
  { label: '我要吐槽', value: '我要吐槽' },
  { label: '我有好想法', value: '我有好想法' },
];

const formData = reactive<FormData>({
  issueType: '提交 Bug', // 默认值
  description: '',
  contactEmail: '',
  contactHsId: '',
  contactPhone: '',
  files: [],
});

const errors = reactive<Errors>({});
const isSubmitting = ref(false);
const submitResult = ref<SubmitResult | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const captchaInput = ref('');
const captchaAnswer = ref(0);
const captchaQuestion = ref('');

// 生成验证码
const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  captchaQuestion.value = `${num1} + ${num2} = ?`;
  captchaAnswer.value = num1 + num2;
};

// 初始化时生成验证码
onMounted(() => {
  generateCaptcha();
});

const descriptionPlaceholder = computed(() => {
  switch (formData.issueType) {
    case '提交 Bug':
      return '请详细描述您遇到的问题：\n1. 问题描述：\n2. 重现步骤：\n3. 预期结果：\n4. 实际结果：';
    case '我要吐槽':
      return '请告诉我们您想吐槽的内容：';
    case '我有好想法':
      return '请分享您的好想法或建议：';
    default:
      return '请输入问题描述';
  }
});

const validateForm = (): boolean => {
  // 清空之前的错误
  Object.keys(errors).forEach(key => delete errors[key as keyof Errors]);
  let isValid = true;

  // 验证验证码
  if (parseInt(captchaInput.value) !== captchaAnswer.value) {
(errors as any).captcha = '验证码错误';
    isValid = false;
  }

  if (!formData.issueType) {
    errors.issueType = '请选择问题类型';
    isValid = false;
  }
  if (!formData.description.trim()) {
    errors.description = '请输入问题描述';
    isValid = false;
  }

  const phoneRegex = /^\d{11}$/;
  if (formData.contactHsId && !phoneRegex.test(formData.contactHsId)) {
    errors.contactHsId = '互生号必须是11位数字';
    isValid = false;
  }
  if (formData.contactPhone && !phoneRegex.test(formData.contactPhone)) {
    errors.contactPhone = '电话号码必须是11位数字';
    isValid = false;
  }

  if (formData.files.length > 3) {
    errors.files = '最多只能上传 3 个文件';
    isValid = false;
  }

  // 可选：添加文件大小和类型的再次验证
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
  data.append('contactEmail', formData.contactEmail);
  data.append('contactHsId', formData.contactHsId);
  data.append('contactPhone', formData.contactPhone);
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
    // 提交成功后清空表单 (可选)
    // Object.assign(formData, { issueType: '提交 Bug', description: '', contactEmail: '', contactHsId: '', contactPhone: '', files: [] });
  } catch (error: any) {
    console.error('Submission error:', error);
    let message = '提交失败，请稍后重试。';
    if (error.response && error.response.data && error.response.data.message) {
      message = `提交失败: ${error.response.data.message}`;
    }
    submitResult.value = { success: false, message };
  } finally {
    isSubmitting.value = false;
  }
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
    errors.files = '最多只能上传 3 个文件';
    // 只添加允许数量的文件
    const remainingSlots = 3 - formData.files.length;
    if (remainingSlots > 0) {
        formData.files.push(...validFiles.slice(0, remainingSlots));
    }
  } else {
    formData.files.push(...validFiles);
    // 如果之前有数量错误，现在数量合法了，清除错误
    if (errors.files === '最多只能上传 3 个文件') {
        delete errors.files;
    }
  }
};

const removeFile = (index: number) => {
  formData.files.splice(index, 1);
  // 如果移除文件后数量合法，清除数量错误
  if (formData.files.length <= 3 && errors.files === '最多只能上传 3 个文件') {
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
/* 如果需要额外的 scoped 样式，可以在这里添加 */
</style>
