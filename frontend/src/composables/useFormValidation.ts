import type { FormInstance, FormRules } from 'element-plus';
import { computed, reactive, readonly, type Ref } from 'vue';

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'length' | 'custom';
}

export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  touched: Record<string, boolean>;
  validating: Record<string, boolean>;
}

export interface UseFormValidationOptions {
  immediate?: boolean;
  debounceMs?: number;
}

export function useFormValidation(
  formRef: Ref<FormInstance | undefined>,
  rules: FormRules,
  options: UseFormValidationOptions = {}
) {
  const { immediate = false, debounceMs = 300 } = options;

  const validationState = reactive<ValidationState>({
    isValid: false,
    errors: [],
    touched: {},
    validating: {},
  });

  const isValidating = computed(() => Object.values(validationState.validating).some(v => v));

  // 实时验证单个字段
  const validateField = async (field: string, _value: unknown): Promise<boolean> => {
    if (!formRef.value) return false;

    validationState.validating[field] = true;
    validationState.touched[field] = true;

    try {
      await formRef.value.validateField(field);
      // 移除该字段的错误
      validationState.errors = validationState.errors.filter(e => e.field !== field);
      return true;
    } catch (error: unknown) {
      // 添加或更新错误
      const existingErrorIndex = validationState.errors.findIndex(e => e.field === field);
      const errorMessage = error instanceof Error ? error.message : '验证失败';
      const newError: ValidationError = {
        field,
        message: errorMessage,
        type: getErrorType(error),
      };

      if (existingErrorIndex >= 0) {
        validationState.errors[existingErrorIndex] = newError;
      } else {
        validationState.errors.push(newError);
      }
      return false;
    } finally {
      validationState.validating[field] = false;
      updateValidationState();
    }
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

  return {
    validationState: readonly(validationState),
    isValidating,
    validateField: immediate ? validateField : debouncedValidateField,
    validateForm,
    clearValidation,
    getFieldError,
    hasFieldError,
    isFieldTouched,
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
