import type { FormInstance, FormRules } from 'element-plus';
import { computed, reactive, readonly, type Ref } from 'vue';

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'length' | 'custom';
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  touched: Record<string, boolean>;
  validating: Record<string, boolean>;
  fieldStates: Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>;
}

export interface UseFormValidationOptions {
  immediate?: boolean;
  debounceMs?: number;
  showWarnings?: boolean;
  validateOnInput?: boolean;
  validateOnBlur?: boolean;
}

export function useFormValidation(
  formRef: Ref<FormInstance | undefined>,
  rules: FormRules,
  options: UseFormValidationOptions = {}
) {
  const {
    immediate = false,
    debounceMs = 300,
    showWarnings = true,
    validateOnInput = true,
    validateOnBlur = true,
  } = options;

  const validationState = reactive<ValidationState>({
    isValid: false,
    errors: [],
    warnings: [],
    touched: {},
    validating: {},
    fieldStates: {},
  });

  const isValidating = computed(() => Object.values(validationState.validating).some(v => v));
  const hasErrors = computed(() => validationState.errors.length > 0);
  const hasWarnings = computed(() => validationState.warnings.length > 0);
  const validationProgress = computed(() => {
    const totalFields = Object.keys(rules).length;
    const validatedFields = Object.values(validationState.fieldStates).filter(
      state => state === 'valid' || state === 'invalid'
    ).length;
    return totalFields > 0 ? Math.round((validatedFields / totalFields) * 100) : 0;
  });

  // 实时验证单个字段
  const validateField = async (
    field: string,
    value: unknown,
    trigger: 'input' | 'blur' | 'change' = 'input'
  ): Promise<boolean> => {
    if (!formRef.value) return false;

    // 检查是否应该在此触发器上验证
    if (!shouldValidateOnTrigger(trigger)) return true;

    validationState.validating[field] = true;
    validationState.touched[field] = true;
    validationState.fieldStates[field] = 'validating';

    try {
      await formRef.value.validateField(field);

      // 移除该字段的错误和警告
      validationState.errors = validationState.errors.filter(e => e.field !== field);
      validationState.warnings = validationState.warnings.filter(e => e.field !== field);
      validationState.fieldStates[field] = 'valid';

      // 检查警告
      if (showWarnings) {
        const warnings = await checkFieldWarnings(field, value);
        if (warnings.length > 0) {
          validationState.warnings.push(...warnings);
        }
      }

      return true;
    } catch (error: unknown) {
      // 添加或更新错误
      const errorMessage = error instanceof Error ? error.message : '验证失败';
      const newError: ValidationError = {
        field,
        message: errorMessage,
        type: getErrorType(error),
        severity: 'error',
      };

      // 移除旧错误并添加新错误
      validationState.errors = validationState.errors.filter(e => e.field !== field);
      validationState.errors.push(newError);
      validationState.fieldStates[field] = 'invalid';

      return false;
    } finally {
      validationState.validating[field] = false;
      updateValidationState();
    }
  };

  // 检查是否应该在指定触发器上验证
  const shouldValidateOnTrigger = (trigger: 'input' | 'blur' | 'change'): boolean => {
    switch (trigger) {
      case 'input':
        return validateOnInput;
      case 'blur':
        return validateOnBlur;
      case 'change':
        return true; // 总是在 change 时验证
      default:
        return true;
    }
  };

  // 检查字段警告
  const checkFieldWarnings = async (field: string, value: unknown): Promise<ValidationError[]> => {
    const warnings: ValidationError[] = [];

    // 根据字段类型添加特定警告
    switch (field) {
      case 'description':
        if (typeof value === 'string' && value.length > 0 && value.length < 50) {
          warnings.push({
            field,
            message: '建议提供更详细的描述以便更好地处理问题',
            type: 'custom',
            severity: 'warning',
          });
        }
        break;
      case 'email':
        if (typeof value === 'string' && (value.includes('test') || value.includes('example'))) {
          warnings.push({
            field,
            message: '建议使用真实邮箱以便接收处理进度通知',
            type: 'custom',
            severity: 'warning',
          });
        }
        break;
      case 'phone':
        if (typeof value === 'string' && value.startsWith('000')) {
          warnings.push({
            field,
            message: '请确认手机号码是否正确',
            type: 'custom',
            severity: 'warning',
          });
        }
        break;
    }

    return warnings;
  };

  // 验证整个表单
  const validateForm = async (): Promise<boolean> => {
    if (!formRef.value) return false;

    try {
      await formRef.value.validate();
      validationState.errors = [];
      validationState.isValid = true;
      return true;
    } catch {
      validationState.isValid = false;
      return false;
    }
  };

  // 清除验证状态
  const clearValidation = (field?: string) => {
    if (field) {
      validationState.errors = validationState.errors.filter(e => e.field !== field);
      delete validationState.touched[field];
      delete validationState.validating[field];
    } else {
      validationState.errors = [];
      validationState.touched = {};
      validationState.validating = {};
    }
    updateValidationState();
  };

  // 获取字段错误
  const getFieldError = (field: string): ValidationError | undefined => {
    return validationState.errors.find(e => e.field === field);
  };

  // 检查字段是否有错误
  const hasFieldError = (field: string): boolean => {
    return validationState.errors.some(e => e.field === field);
  };

  // 检查字段是否已被触摸
  const isFieldTouched = (field: string): boolean => {
    return validationState.touched[field] || false;
  };

  // 更新整体验证状态
  const updateValidationState = () => {
    validationState.isValid = validationState.errors.length === 0;
  };

  // 获取错误类型
  const getErrorType = (error: unknown): ValidationError['type'] => {
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      if (errorObj.required) return 'required';
      if (errorObj.pattern || errorObj.type) return 'format';
      if (errorObj.min || errorObj.max || errorObj.len) return 'length';
    }
    return 'custom';
  };

  // 防抖验证
  const debouncedValidateField = debounce(validateField, debounceMs);

  // 获取字段警告
  const getFieldWarning = (field: string): ValidationError | undefined => {
    return validationState.warnings.find(e => e.field === field);
  };

  // 检查字段是否有警告
  const hasFieldWarning = (field: string): boolean => {
    return validationState.warnings.some(e => e.field === field);
  };

  // 获取字段状态
  const getFieldState = (field: string): 'idle' | 'validating' | 'valid' | 'invalid' => {
    return validationState.fieldStates[field] || 'idle';
  };

  // 批量验证字段
  const validateFields = async (fields: string[]): Promise<boolean> => {
    const results = await Promise.all(
      fields.map(field => validateField(field, undefined, 'change'))
    );
    return results.every(result => result);
  };

  // 获取验证摘要
  const getValidationSummary = () => {
    const totalFields = Object.keys(rules).length;
    const validFields = Object.values(validationState.fieldStates).filter(
      state => state === 'valid'
    ).length;
    const invalidFields = validationState.errors.length;
    const warningFields = validationState.warnings.length;

    return {
      total: totalFields,
      valid: validFields,
      invalid: invalidFields,
      warnings: warningFields,
      progress: validationProgress.value,
      isComplete: validFields + invalidFields === totalFields,
    };
  };

  return {
    validationState: readonly(validationState),
    isValidating,
    hasErrors,
    hasWarnings,
    validationProgress,
    validateField: immediate ? validateField : debouncedValidateField,
    validateForm,
    validateFields,
    clearValidation,
    getFieldError,
    getFieldWarning,
    hasFieldError,
    hasFieldWarning,
    isFieldTouched,
    getFieldState,
    getValidationSummary,
  };
}

// 防抖工具函数
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
