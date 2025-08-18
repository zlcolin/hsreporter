export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

export interface FeedbackRequest {
  type: 'bug' | 'complaint' | 'suggestion';
  description: string;
  contact?: {
    email?: string;
    phone?: string;
    hsId?: string;
  };
  captcha: string;
  captchaId: string;
}

export interface FeedbackResponse {
  id: string;
  issueId?: number;
  status: 'submitted' | 'processing' | 'resolved' | 'closed';
  submittedAt: string;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

export interface CaptchaResponse {
  imageUrl: string;
  captchaId: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version?: string;
  checks: {
    redis?: { status: string };
    redmine?: { status: string };
    disk?: { status: string };
    memory: NodeJS.MemoryUsage;
  };
}