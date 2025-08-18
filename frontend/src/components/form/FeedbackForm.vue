<template>
  <div class="feedback-form">
    <el-form ref="formRef" :model="feedbackStore.currentForm" :rules="formRules" class="feedback-form__inner"
      @validate="handleFieldValidation">
      <!-- Form Type Tabs -->
      <div class="form-tabs">
        <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
          <el-tab-pane label="提交 Bug" name="bug">
            <bug-form v-model="feedbackStore.currentForm" @input="handleFormInput" />
          </el-tab-pane>
          <el-tab-pane label="我要吐槽" name="complaint">
            <complaint-form v-model="feedbackStore.currentForm" @input="handleFormInput" />
          </el-tab-pane>
          <el-tab-pane label="我有好想法" name="suggestion">
            <suggestion-form v-model="feedbackStore.currentForm" @input="handleFormInput" />
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- Description Field -->
      <enhanced-form-item label="问题描述" prop="description" :required="true" help-text="请详细描述问题现象、重现步骤和预期结果，至少10个字符"
        :show-char-count="true" :max-length="5000" :current-length="feedbackStore.currentForm.description.length">
        <base-input v-model="feedbackStore.currentForm.description" type="textarea" placeholder="请详细描述问题现象、重现步骤和预期结果..."
          :rows="6" :maxlength="5000" show-word-limit :error-message="getFieldError('description')"
          @validate="handleFieldValidation" />
      </enhanced-form-item>

      <!-- Contact Information -->
      <div class="contact-section">
        <h4 class="section-title">
          联系信息
          <span class="optional-text">(选填，便于我们联系您)</span>
        </h4>
        <el-row :gutter="appStore.isMobile ? 0 : 15" class="contact-row">
          <el-col :xs="24" :sm="12" class="contact-col">
            <enhanced-form-item label="电子邮箱" prop="email" help-text="用于接收处理进度通知">
              <base-input v-model="feedbackStore.currentForm.email" type="email" placeholder="your@example.com"
                :size="appStore.isMobile ? 'large' : 'default'" :error-message="getFieldError('email')"
                @validate="handleFieldValidation" />
            </enhanced-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" class="contact-col">
            <enhanced-form-item label="手机号码" prop="phone" help-text="用于紧急情况联系">
              <base-input v-model="feedbackStore.currentForm.phone" type="tel" placeholder="13800138000" :maxlength="11"
                :size="appStore.isMobile ? 'large' : 'default'" :error-message="getFieldError('phone')"
                @validate="handleFieldValidation" />
            </enhanced-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- File Upload -->
      <enhanced-form-item label="文件上传" prop="files" help-text="支持图片、视频等文件，单个文件最大100MB，最多3个文件">
        <enhanced-file-upload v-model="fileList" :max-files="3" :max-size="100 * 1024 * 1024" :auto-upload="false"
          @change="handleFileChange" @exceed="handleExceed" @before-upload="beforeUpload" />
      </enhanced-form-item>

      <!-- Captcha -->
      <enhanced-form-item label="验证码" prop="captcha" :required="true" help-text="请输入图片中的4位数字">
        <captcha-input v-model="feedbackStore.currentForm.captcha" :disabled="appStore.loading.isLoading"
          @verified="handleCaptchaVerified" @error="handleCaptchaError" ref="captchaRef" />
      </enhanced-form-item>

      <!-- Submit Actions -->
      <div class="form-actions">
        <loading-progress v-if="appStore.loading.isLoading" :loading="appStore.loading.isLoading"
          :progress="appStore.loading.progress" :message="appStore.loading.message" :error="appStore.loading.error"
          :show-retry="true" @retry="handleRetry" />

        <div v-else class="action-buttons">
          <base-button type="primary" size="large" variant="gradient" :disabled="!feedbackStore.canSubmit"
            @click="submitForm" class="submit-button" block>
            <el-icon>
              <upload />
            </el-icon>
            提交反馈
          </base-button>

          <base-button size="large" variant="outline" @click="resetForm" class="reset-button" block>
            <el-icon><refresh-left /></el-icon>
            重置表单
          </base-button>
        </div>

        <!-- Form Status -->
        <div class="form-status" v-if="validationSummary.length > 0">
          <el-alert :title="`还有 ${validationSummary.length} 个问题需要解决`" type="warning" :closable="false" show-icon>
            <ul class="validation-list">
              <li v-for="issue in validationSummary" :key="issue">{{ issue }}</li>
            </ul>
          </el-alert>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { RefreshLeft, Upload } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { computed, nextTick, onMounted, ref } from 'vue';

// Components
import BugForm from '../BugForm.vue';
import CaptchaInput from '../CaptchaInput.vue';
import ComplaintForm from '../ComplaintForm.vue';
import EnhancedFileUpload from '../EnhancedFileUpload.vue';
import EnhancedFormItem from '../EnhancedFormItem.vue';
import LoadingProgress from '../LoadingProgress.vue';
import SuggestionForm from '../SuggestionForm.vue';
import BaseButton from '../common/BaseButton.vue';
import BaseInput from '../common/BaseInput.vue';

// Composables and Stores
import { useStores } from '@/composables/useStores';
import { createFormRules } from '@/utils/validation';

// Store instances
const { feedbackStore, appStore, userStore } = useStores();

// Reactive data
const formRef = ref<FormInstance>();
const captchaRef = ref();
const activeTab = ref('bug');
const fileList = ref([]);
const captchaVerified = ref(false);

// Form rules
const formRules = createFormRules();

// Computed properties
const validationSummary = computed(() => {
  const issues: string[] = [];

  if (
    !feedbackStore.currentForm.description ||
    feedbackStore.currentForm.description.trim().length < 10
  ) {
    issues.push('问题描述至少需要10个字符');
  }

  if (
    feedbackStore.currentForm.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(feedbackStore.currentForm.email)
  ) {
    issues.push('邮箱格式不正确');
  }

  if (feedbackStore.currentForm.phone && !/^1[3-9]\d{9}$/.test(feedbackStore.currentForm.phone)) {
    issues.push('手机号格式不正确');
  }

  if (!captchaVerified.value) {
    issues.push('请完成验证码验证');
  }

  return issues;
});

// Event handlers
const handleTabChange = (tabName: string) => {
  // Clear tab-specific validation errors
  const tabSpecificFields = {
    bug: ['severity', 'environment'],
    complaint: ['complaintType', 'expectedImprovement'],
    suggestion: ['suggestionType', 'benefit'],
  };

  Object.values(tabSpecificFields)
    .flat()
    .forEach(field => {
      feedbackStore.clearValidationError(field);
    });
};

const handleFormInput = () => {
  nextTick(() => {
    if (userStore.preferences.autoSaveDraft) {
      feedbackStore.saveDraft();
    }
  });
};

const handleFieldValidation = (prop: string, isValid: boolean, message: string) => {
  if (!isValid && message) {
    feedbackStore.setValidationError(prop, [message]);
  } else {
    feedbackStore.clearValidationError(prop);
  }
};

const getFieldError = (field: string): string | undefined => {
  const errors = feedbackStore.validationErrors[field];
  return errors && errors.length > 0 ? errors[0] : undefined;
};

const submitForm = async () => {
  try {
    appStore.startLoading({
      message: '正在提交反馈...',
      showProgress: true,
      timeout: 30000,
    });

    // Validate form
    const isValid = await formRef.value?.validate();
    if (!isValid) {
      appStore.setLoadingError('表单验证失败，请检查输入内容');
      appStore.showError('表单验证失败，请检查输入内容');
      return;
    }

    // Check captcha
    if (!captchaVerified.value) {
      appStore.setLoadingError('请先完成验证码验证');
      appStore.showError('请先完成验证码验证');
      return;
    }

    // Submit through store
    appStore.updateLoadingProgress(20, '正在验证数据...');
    await new Promise(resolve => setTimeout(resolve, 500));

    appStore.updateLoadingProgress(40, '正在上传文件...');
    await new Promise(resolve => setTimeout(resolve, 800));

    appStore.updateLoadingProgress(70, '正在提交到系统...');
    const result = await feedbackStore.submitForm();

    if (result.success) {
      appStore.updateLoadingProgress(100, '提交完成');
      appStore.finishLoading('提交完成');

      appStore.showSuccess(`反馈提交成功！问题单编号：#${result.issueId}`, '提交成功');

      // Reset form after success
      setTimeout(() => {
        resetForm();
      }, 2000);
    } else {
      appStore.setLoadingError(result.error || '提交失败');
      appStore.showError(result.error || '提交失败', '提交失败');
    }
  } catch (error: any) {
    appStore.setLoadingError(error.message || '提交失败，请重试');
    appStore.showError(error.message || '提交失败，请重试', '提交失败');
  }
};

const resetForm = async () => {
  try {
    formRef.value?.resetFields();
    feedbackStore.resetForm();
    fileList.value = [];
    captchaVerified.value = false;
    appStore.resetLoading();

    await nextTick();
    captchaRef.value?.refresh();

    appStore.showInfo('表单已重置');
  } catch (error) {
    console.error('重置表单失败:', error);
  }
};

const handleRetry = () => {
  appStore.resetLoading();
  submitForm();
};

const handleFileChange = (files: any[]) => {
  feedbackStore.updateForm({ files });
  handleFormInput();
};

const handleExceed = (files: File[], fileList: any[]) => {
  appStore.showWarning(
    `当前限制选择 3 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length} 个文件`
  );
};

const beforeUpload = (file: File) => {
  const isLt100M = file.size / 1024 / 1024 < 100;
  if (!isLt100M) {
    appStore.showError('文件大小不能超过 100MB!');
    return false;
  }
  return true;
};

const handleCaptchaVerified = (captchaId: string) => {
  captchaVerified.value = true;
  feedbackStore.clearValidationError('captcha');
  console.log('验证码验证成功:', captchaId);
};

const handleCaptchaError = (error: string) => {
  captchaVerified.value = false;
  appStore.showError(`验证码错误: ${error}`);
};

// Lifecycle
onMounted(() => {
  // Load draft if auto-save is enabled
  if (userStore.preferences.autoSaveDraft) {
    const hasDraft = feedbackStore.loadDraft();
    if (hasDraft) {
      appStore.showInfo('已恢复上次编辑的内容', '草稿恢复');
    }
  }

  // Load contact info if remember is enabled
  if (userStore.preferences.rememberContactInfo && userStore.hasContactInfo) {
    feedbackStore.updateForm({
      email: userStore.contactInfo.email,
      phone: userStore.contactInfo.phone,
    });
  }
});
</script>

<style scoped>
.feedback-form {
  width: 100%;
}

.feedback-form__inner {
  padding: 0;
}

.form-tabs {
  margin-bottom: var(--spacing-lg);
}

.form-tabs :deep(.el-tabs__item) {
  font-weight: 500;
  transition: all var(--duration-normal) ease;
  padding: var(--spacing-md) var(--spacing-lg);
}

.form-tabs :deep(.el-tabs__item.is-active) {
  color: var(--color-primary);
}

.contact-section {
  margin: var(--spacing-2xl) 0;
  padding: var(--spacing-lg);
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-primary);
}

.section-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.optional-text {
  font-size: var(--font-size-xs);
  font-weight: 400;
  color: var(--color-text-secondary);
}

.contact-row {
  margin: 0 calc(var(--spacing-sm) * -1);
}

.contact-col {
  padding: 0 var(--spacing-sm);
}

.form-actions {
  margin-top: var(--spacing-2xl);
  padding: var(--spacing-xl);
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
  text-align: center;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.form-status {
  margin-top: var(--spacing-md);
}

.validation-list {
  margin: var(--spacing-sm) 0 0 0;
  padding-left: var(--spacing-lg);
  text-align: left;
}

.validation-list li {
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .contact-section {
    margin: var(--spacing-xl) 0;
    padding: var(--spacing-lg);
  }

  .contact-row {
    margin: 0;
    flex-direction: column;
  }

  .contact-col {
    padding: 0;
    margin-bottom: var(--spacing-lg);
    width: 100% !important;
  }

  .contact-col:last-child {
    margin-bottom: 0;
  }

  .action-buttons {
    gap: var(--spacing-lg);
  }

  .form-actions {
    padding: var(--spacing-xl);
    margin-top: var(--spacing-xl);
  }

  .section-title {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
    text-align: left;
  }
}
</style>
