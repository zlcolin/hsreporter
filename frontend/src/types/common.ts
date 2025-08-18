// 通用类型定义

export interface FormData {
  description: string;
  email: string;
  phone: string;
  captcha: string;
  files: File[];
  // Bug 表单特有字段
  severity?: 'low' | 'medium' | 'high' | 'critical';
  environment?: string;
  // 投诉表单特有字段
  complaintType?: 'functionality' | 'usability' | 'performance' | 'other';
  expectedImprovement?: string;
  // 建议表单特有字段
  suggestionType?: 'enhancement' | 'new_feature' | 'process_optimization' | 'other';
  benefit?: string;
}

export interface ValidationRule {
  required?: boolean;
  message: string;
  trigger?: string | string[];
  min?: number;
  max?: number;
  len?: number;
  type?: string;
  pattern?: RegExp;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}

export interface CaptchaResponse {
  imageUrl: string;
  captchaId: string;
}

export interface SubmitResponse {
  issueId: number;
  message: string;
}

export interface FileUploadItem {
  uid: string;
  name: string;
  size: number;
  status: 'ready' | 'uploading' | 'success' | 'fail';
  percentage?: number;
  raw?: File;
  response?: any;
  url?: string;
  compressionRatio?: number;
}

export interface CaptchaState {
  imageUrl: string;
  captchaId: string;
  verified: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoadingOptions {
  message?: string;
  showProgress?: boolean;
  timeout?: number;
}
