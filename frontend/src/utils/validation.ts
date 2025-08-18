import type { FormRules } from 'element-plus';

// 常用正则表达式
export const REGEX_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^1[3-9]\d{9}$/,
  idCard: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
  url: /^https?:\/\/(([a-zA-Z0-9_-])+(\.)?)*(:\d+)?(\/((\.)?(\?)?=?&?[a-zA-Z0-9_-](\?)?)*)*$/i,
  chinese: /^[\u4e00-\u9fa5]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

// 验证器函数
export const validators = {
  // 必填验证
  required: (message: string = '此字段为必填项') => ({
    required: true,
    message,
    trigger: ['blur', 'change'],
  }),

  // 邮箱验证
  email: (message: string = '请输入正确的邮箱格式') => ({
    pattern: REGEX_PATTERNS.email,
    message,
    trigger: ['blur', 'change'],
  }),

  // 手机号验证
  phone: (message: string = '请输入正确的手机号码') => ({
    pattern: REGEX_PATTERNS.phone,
    message,
    trigger: ['blur', 'change'],
  }),

  // 长度验证
  length: (min?: number, max?: number, message?: string) => {
    const rule: any = { trigger: ['blur', 'change'] };

    if (min !== undefined && max !== undefined) {
      rule.min = min;
      rule.max = max;
      rule.message = message || `长度应在 ${min} 到 ${max} 个字符之间`;
    } else if (min !== undefined) {
      rule.min = min;
      rule.message = message || `长度不能少于 ${min} 个字符`;
    } else if (max !== undefined) {
      rule.max = max;
      rule.message = message || `长度不能超过 ${max} 个字符`;
    }

    return rule;
  },

  // 自定义验证
  custom: (validator: (rule: any, value: any, callback: any) => void, message?: string) => ({
    validator,
    message,
    trigger: ['blur', 'change'],
  }),

  // 数字验证
  number: (message: string = '请输入数字') => ({
    type: 'number',
    message,
    trigger: ['blur', 'change'],
  }),

  // URL验证
  url: (message: string = '请输入正确的URL格式') => ({
    pattern: REGEX_PATTERNS.url,
    message,
    trigger: ['blur', 'change'],
  }),

  // 中文验证
  chinese: (message: string = '请输入中文字符') => ({
    pattern: REGEX_PATTERNS.chinese,
    message,
    trigger: ['blur', 'change'],
  }),

  // 强密码验证
  strongPassword: (message: string = '密码必须包含大小写字母、数字和特殊字符，至少8位') => ({
    pattern: REGEX_PATTERNS.strongPassword,
    message,
    trigger: ['blur', 'change'],
  }),
};

// 表单验证规则生成器
export function createFormRules(): FormRules {
  return {
    // 问题描述验证
    description: [
      validators.required('请输入问题描述'),
      validators.length(10, 5000, '问题描述应在10-5000个字符之间'),
      validators.custom((rule, value, callback) => {
        if (value && value.trim().length < 10) {
          callback(new Error('问题描述内容过于简单，请详细描述'));
        } else {
          callback();
        }
      }),
    ],

    // 邮箱验证（可选）
    email: [
      validators.email(),
      validators.custom((rule, value, callback) => {
        if (value && value.includes('test') && process.env.NODE_ENV === 'production') {
          callback(new Error('请使用真实邮箱地址'));
        } else {
          callback();
        }
      }),
    ],

    // 手机号验证（可选）
    phone: [
      validators.phone(),
      validators.custom((rule, value, callback) => {
        if (value && value.startsWith('000')) {
          callback(new Error('请输入真实的手机号码'));
        } else {
          callback();
        }
      }),
    ],

    // Bug表单特有验证
    severity: [validators.required('请选择问题严重程度')],

    environment: [validators.length(5, 500, '环境描述应在5-500个字符之间')],

    // 投诉表单特有验证
    complaintType: [validators.required('请选择投诉类型')],

    expectedImprovement: [validators.length(10, 1000, '期望改进描述应在10-1000个字符之间')],

    // 建议表单特有验证
    suggestionType: [validators.required('请选择建议类型')],

    benefit: [validators.length(5, 500, '预期效益描述应在5-500个字符之间')],

    // 验证码验证
    captcha: [
      validators.required('请输入验证码'),
      validators.length(4, 4, '验证码为4位数字'),
      validators.custom((rule, value, callback) => {
        if (value && !/^\d{4}$/.test(value)) {
          callback(new Error('验证码只能包含数字'));
        } else {
          callback();
        }
      }),
    ],
  };
}

// 实时验证辅助函数
export function validateField(value: any, rules: any[]): { valid: boolean; message?: string } {
  for (const rule of rules) {
    // 必填验证
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return { valid: false, message: rule.message };
    }

    // 如果值为空且不是必填，跳过其他验证
    if (!value || (typeof value === 'string' && !value.trim())) {
      continue;
    }

    // 长度验证
    if (rule.min !== undefined && value.length < rule.min) {
      return { valid: false, message: rule.message };
    }
    if (rule.max !== undefined && value.length > rule.max) {
      return { valid: false, message: rule.message };
    }

    // 正则验证
    if (rule.pattern && !rule.pattern.test(value)) {
      return { valid: false, message: rule.message };
    }

    // 类型验证
    if (rule.type === 'email' && !REGEX_PATTERNS.email.test(value)) {
      return { valid: false, message: rule.message };
    }
    if (rule.type === 'number' && isNaN(Number(value))) {
      return { valid: false, message: rule.message };
    }
  }

  return { valid: true };
}

// 表单数据完整性检查
export function checkFormCompleteness(
  formData: any,
  requiredFields: string[]
): {
  complete: boolean;
  missingFields: string[];
  fieldLabels: Record<string, string>;
} {
  const fieldLabels: Record<string, string> = {
    description: '问题描述',
    email: '邮箱',
    phone: '手机号',
    captcha: '验证码',
    severity: '严重程度',
    environment: '问题环境',
    complaintType: '投诉类型',
    expectedImprovement: '期望改进',
    suggestionType: '建议类型',
    benefit: '预期效益',
  };

  const missingFields = requiredFields.filter(field => {
    const value = formData[field];
    return !value || (typeof value === 'string' && !value.trim());
  });

  return {
    complete: missingFields.length === 0,
    missingFields,
    fieldLabels,
  };
}
