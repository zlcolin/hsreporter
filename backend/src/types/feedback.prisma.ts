import { Feedback } from '@prisma/client';

// 扩展 Prisma 生成的 Feedback 类型
export interface FeedbackWithMetadata extends Feedback {
  metadata: {
    ip: string;
    userAgent?: string;
    timestamp: Date;
    source: string;
  };
  redmine?: {
    issueId: number;
    status: string;
  };
}

// 创建反馈的输入类型
export interface CreateFeedbackInput {
  type: string;
  content: string;
  contact?: string | null;
  metadata: {
    ip: string;
    userAgent?: string;
    timestamp: Date;
    source: string;
  };
}