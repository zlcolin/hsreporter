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
        :show-char-count="true" :max-length="5000" :current-length="feedbackStore.currentForm.description.length"
        :validation-state="formValidation.getFieldState('description')" :real-time-validation="true">
        <base-input v-model="feedbackStore.currentForm.description" type="textarea" placeholder="请详细描述问题现象、重现步骤和预期结果..."
          :rows="6" :maxlength="5000" show-word-limit :error-message="getFieldError('description')"
          :validation-state="formValidation.getFieldState('description')" :validate-on-input="true"
          :validate-on-blur="true" :debounce-ms="500" @validate="value => handleDescriptionValidation(value)" />
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

        <!-- Validation Warnings -->
        <div class="form-warnings" v-if="validationWarnings.length > 0 && validationSummary.length === 0">
          <el-alert title="建议优化" type="warning" :closable="true" show-icon>
            <ul class="validation-list">
              <li v-for="warning in validationWarnings" :key="warning">{{ warning }}</li>
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
import { computed, nextTick, onMounted, provide, ref } from 'vue';

// Components
import BugForm from '../BugForm.vue';
import CaptchaInput from '../CaptchaInput.vue';
import ComplaintForm from '../ComplaintForm.vue';
import EnhancedFileUpload from '../EnhancedFileUpload.vue';
import EnhancedFormItem from '../EnhancedFormItem.vue';
import SuggestionForm from '../SuggestionForm.vue';
import BaseButton from '../common/BaseButton.vue';
import BaseInput from '../common/BaseInput.vue';

// Composables and Stores
import { useFormValidation } from '@/composables/useFormValidation';
import { useNotification } from '@/composables/useNotification';
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

// Composables
const notification = useNotification();
const formValidation = useFormValidation(formRef, formRules, {
  immediate: false,
  debounceMs: 500,
  showWarnings: true,
  validateOnInput: true,
  validateOnBlur: true,
});

// Provide validation state to child components
provide('validationState', formValidation.validationState);
provide('isValidating', formValidation.isValidating);

// Computed properties
const validationSummary = computed(() => {
  const issues: string[] = [];

  // 从增强验证系统获取错误，但排除验证码字段（因为我们单独处理）
  if (formValidation.hasErrors.value) {
    const nonCaptchaErrors = formValidation.validationState.errors
      .filter(e => e.field !== 'captcha')
      .map(e => e.message);
    issues.push(...nonCaptchaErrors);
  }

  // 检查验证码（只有在未验证时才显示错误）
  if (!captchaVerified.value) {
    issues.push('请完成验证码验证');
  }

  return issues;
});

const validationWarnings = computed(() => {
  if (formValidation.hasWarnings.value) {
    return formValidation.validationState.warnings.map(w => w.message);
  }
  return [];
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

const handleFieldValidation = async (prop: string, isValid?: boolean, message?: string) => {
  // 处理Element Plus表单验证事件
  if (typeof isValid === 'boolean') {
    if (!isValid && message) {
      feedbackStore.setValidationError(prop, [message]);
    } else {
      feedbackStore.clearValidationError(prop);
    }
  }

  // 实时验证
  if (formValidation && feedbackStore.currentForm[prop] !== undefined) {
    await formValidation.validateField(prop, feedbackStore.currentForm[prop], 'change');
  }
};

const handleDescriptionValidation = async (value: string | number) => {
  // 先清除旧的错误
  feedbackStore.clearValidationError('description');

  // 执行表单验证系统的验证
  if (formValidation) {
    await formValidation.validateField('description', value, 'input');
  }
};

const getFieldError = (field: string): string | undefined => {
  // 首先检查表单验证系统的错误
  const formValidationError = formValidation.getFieldError(field);
  if (formValidationError) {
    return formValidationError.message;
  }

  // 然后检查store中的错误
  const storeErrors = feedbackStore.validationErrors[field];
  return storeErrors && storeErrors.length > 0 ? storeErrors[0] : undefined;
};

const submitForm = async () => {
  try {
    appStore.startLoading({
      message: '正在提交反馈...',
      showProgress: true,
      timeout: 30000,
    });

    // 步骤1: 验证表单
    appStore.updateLoadingProgress(20, '正在验证表单数据...');
    const isValid = await formValidation.validateForm();
    if (!isValid) {
      const errors = formValidation.validationState.errors.map(e => e.message);
      appStore.setLoadingError('表单验证失败');
      notification.showValidationError(errors);
      return;
    }

    // 步骤2: 验证验证码
    appStore.updateLoadingProgress(40, '正在验证验证码...');
    if (!captchaVerified.value) {
      appStore.setLoadingError('请先完成验证码验证');
      notification.error('请先完成验证码验证');
      return;
    }

    // 步骤3: 上传文件
    appStore.updateLoadingProgress(60, '正在上传附件...');
    await new Promise(resolve => setTimeout(resolve, 800));

    // 步骤4: 提交到系统
    appStore.updateLoadingProgress(80, '正在提交到系统...');
    const result = await feedbackStore.submitForm();

    if (result.success) {
      // 步骤5: 完成
      appStore.updateLoadingProgress(100, '提交完成');
      appStore.finishLoading('提交完成');

      notification.showCompletionSuccess('反馈提交', `问题单编号：#${result.issueId}`, 5000);

      // 显示警告信息（如果有）
      if (formValidation.hasWarnings.value) {
        const warnings = formValidation.validationState.warnings.map(w => w.message);
        setTimeout(() => {
          notification.showValidationWarning(warnings);
        }, 1000);
      }

      // Reset form after success
      setTimeout(() => {
        resetForm();
      }, 2000);
    } else {
      appStore.setLoadingError(result.error || '提交失败');
      notification.showOperationError('反馈提交', result.error);
    }
  } catch (error: any) {
    appStore.setLoadingError(error.message || '提交失败，请重试');
    notification.showOperationError('反馈提交', error.message);
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

  // 清除表单验证系统中的验证码错误
  if (formValidation) {
    formValidation.clearValidation('captcha');
  }

  // 不要修改表单中的captcha字段值，保持用户输入的验证码
  // 只需要记录验证成功的状态即可

  console.log('验证码验证成功:', captchaId);
};

const handleCaptchaError = (error: string) => {
  captchaVerified.value = false;

  // 设置验证码错误到store和表单验证系统
  feedbackStore.setValidationError('captcha', [error]);

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

.form-warnings {
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
  .feedback-form__inner {
    padding: var(--spacing-md);
  }

  .form-tabs {
    margin-bottom: var(--spacing-lg);
  }

  .form-tabs :deep(.el-tabs__header) {
    margin-bottom: var(--spacing-md);
  }

  .form-tabs :deep(.el-tabs__nav-wrap) {
    padding: 0;
  }

  .form-tabs :deep(.el-tabs__item) {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-base);
    min-height: var(--touch-target-size);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-mobile) var(--border-radius-mobile) 0 0;
    font-weight: 500;
    transition: all var(--duration-normal) ease;
  }

  .form-tabs :deep(.el-tabs__item.is-active) {
    background: var(--color-bg-primary);
    color: var(--color-primary);
    border-bottom: 2px solid var(--color-primary);
    transform: translateY(-1px);
  }

  .form-tabs :deep(.el-tabs__item:active) {
    transform: scale(0.98);
    background: var(--color-bg-tertiary);
  }

  .contact-section {
    margin: var(--spacing-xl) 0;
    padding: var(--spacing-lg);
    border-radius: var(--border-radius-mobile-lg);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    box-shadow: var(--shadow-sm);
  }

  .contact-row {
    margin: 0;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .contact-col {
    padding: 0;
    width: 100% !important;
  }

  .action-buttons {
    gap: var(--spacing-lg);
  }

  .form-actions {
    padding: var(--spacing-xl);
    margin-top: var(--spacing-xl);
    border-radius: var(--border-radius-mobile-lg);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    box-shadow: var(--shadow-sm);
  }

  .section-title {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
    text-align: left;
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-lg);
  }

  .optional-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-weight: 400;
  }



  .form-status,
  .form-warnings {
    margin-top: var(--spacing-lg);
  }

  .form-status :deep(.el-alert),
  .form-warnings :deep(.el-alert) {
    border-radius: var(--border-radius-mobile);
    padding: var(--spacing-lg);
    border: 1px solid var(--color-border-primary);
  }

  .form-status :deep(.el-alert__title),
  .form-warnings :deep(.el-alert__title) {
    font-size: var(--font-size-base);
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
  }

  .validation-list {
    margin: var(--spacing-md) 0 0 0;
    padding-left: var(--spacing-lg);
    text-align: left;
  }

  .validation-list li {
    margin-bottom: var(--spacing-sm);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    color: var(--color-text-secondary);
  }
}

/* Extra small mobile devices */
@media (max-width: 479px) {
  .feedback-form__inner {
    padding: var(--spacing-sm);
  }

  .contact-section {
    padding: var(--spacing-md);
    margin: var(--spacing-lg) 0;
  }

  .form-actions {
    padding: var(--spacing-lg);
  }

  .section-title {
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-md);
  }

  .form-tabs :deep(.el-tabs__item) {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
  }
}

/* Tablet optimizations */
@media (min-width: 768px) and (max-width: 1023px) {
  .contact-row {
    margin: 0 calc(var(--spacing-md) * -1);
    gap: 0;
  }

  .contact-col {
    padding: 0 var(--spacing-md);
  }

  .form-actions {
    padding: var(--spacing-xl) var(--spacing-2xl);
  }

  .action-buttons {
    flex-direction: row;
    gap: var(--spacing-xl);
  }

  .action-buttons .el-button {
    flex: 1;
  }
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  .feedback-form__inner {
    padding: var(--spacing-xl);
  }

  .contact-section {
    padding: var(--spacing-xl);
  }

  .form-actions {
    padding: var(--spacing-2xl);
  }

  .action-buttons {
    flex-direction: row;
    gap: var(--spacing-xl);
    max-width: 600px;
    margin: 0 auto;
  }

  .action-buttons .el-button {
    flex: 1;
    min-height: 48px;
  }

  .form-tabs :deep(.el-tabs__item):hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    transform: translateY(-1px);
  }
}
</style>
