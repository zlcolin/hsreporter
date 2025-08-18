// Store related types
import type { FormData } from './common';

export interface FeedbackState {
  currentForm: FormData;
  submissionHistory: SubmissionRecord[];
  isSubmitting: boolean;
  lastSubmissionId: string | null;
  draftSaved: boolean;
  validationErrors: Record<string, string[]>;
}

export interface SubmissionRecord {
  id: string;
  type: 'bug' | 'complaint' | 'suggestion';
  title: string;
  description: string;
  status: 'submitted' | 'processing' | 'resolved' | 'closed';
  submittedAt: Date;
  issueId?: number;
}

export interface AppState {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  notifications: NotificationItem[];
  loading: LoadingState;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration: number;
  timestamp: Date;
  read?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  type: 'primary' | 'text' | 'default';
  handler: () => void;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
  progress: number;
  error: string | null;
  showProgress: boolean;
}

export interface UserState {
  preferences: UserPreferences;
  contactInfo: ContactInfo;
  sessionId: string | null;
}

export interface UserPreferences {
  autoSaveDraft: boolean;
  notificationEnabled: boolean;
  defaultFormType: 'bug' | 'complaint' | 'suggestion';
  rememberContactInfo: boolean;
}

export interface ContactInfo {
  email: string;
  phone: string;
  hsId: string;
}
