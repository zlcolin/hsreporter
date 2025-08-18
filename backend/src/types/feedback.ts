export interface FeedbackData {
  id: string;
  type: 'bug' | 'complaint' | 'suggestion';
  description: string;
  contact?: {
    email?: string;
    phone?: string;
    hsId?: string;
  };
  attachments: FileAttachment[];
  metadata: {
    userAgent?: string;
    ip: string;
    timestamp: Date;
    source: string;
  };
  redmine?: {
    issueId?: number;
    status?: string;
    assignee?: string;
  };
  status: 'submitted' | 'processing' | 'resolved' | 'closed';
}

export interface FileAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
  redmineToken?: string;
}