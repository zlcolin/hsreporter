import { submitFeedback } from '@/services/api';
import type { FormData } from '@/types/common';
import type { SubmissionRecord } from '@/types/store';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useFeedbackStore = defineStore('feedback', () => {
  // State
  const currentForm = ref<FormData>({
    description: '',
    email: '',
    phone: '',
    captcha: '',
    files: [],
  });

  const submissionHistory = ref<SubmissionRecord[]>([]);
  const isSubmitting = ref(false);
  const lastSubmissionId = ref<string | null>(null);
  const draftSaved = ref(false);
  const validationErrors = ref<Record<string, string[]>>({});

  // Getters
  const hasValidationErrors = computed(() => {
    return Object.keys(validationErrors.value).length > 0;
  });

  const formProgress = computed(() => {
    const requiredFields = ['description'];
    const optionalFields = ['email', 'phone'];
    let completedFields = 0;

    // Check required fields
    requiredFields.forEach(field => {
      if (
        currentForm.value[field as keyof FormData] &&
        String(currentForm.value[field as keyof FormData]).trim()
      ) {
        completedFields += 2; // Higher weight for required fields
      }
    });

    // Check optional fields
    optionalFields.forEach(field => {
      if (
        currentForm.value[field as keyof FormData] &&
        String(currentForm.value[field as keyof FormData]).trim()
      ) {
        completedFields += 1;
      }
    });

    // Check files
    if (currentForm.value.files.length > 0) {
      completedFields += 1;
    }

    const maxScore = requiredFields.length * 2 + optionalFields.length + 1;
    return Math.round((completedFields / maxScore) * 100);
  });

  const canSubmit = computed(() => {
    const hasDescription =
      currentForm.value.description && currentForm.value.description.trim().length >= 10;
    const hasValidEmail =
      !currentForm.value.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentForm.value.email);
    const hasValidPhone = !currentForm.value.phone || /^1[3-9]\d{9}$/.test(currentForm.value.phone);

    return hasDescription && hasValidEmail && hasValidPhone && !isSubmitting.value;
  });

  // Actions
  const updateForm = (updates: Partial<FormData>) => {
    Object.assign(currentForm.value, updates);
    saveDraft();
  };

  const resetForm = () => {
    currentForm.value = {
      description: '',
      email: '',
      phone: '',
      captcha: '',
      files: [],
    };
    validationErrors.value = {};
    draftSaved.value = false;
    clearDraft();
  };

  const setValidationError = (field: string, errors: string[]) => {
    if (errors.length > 0) {
      validationErrors.value[field] = errors;
    } else {
      delete validationErrors.value[field];
    }
  };

  const clearValidationError = (field: string) => {
    delete validationErrors.value[field];
  };

  const clearAllValidationErrors = () => {
    validationErrors.value = {};
  };

  const saveDraft = () => {
    try {
      if (currentForm.value.description && currentForm.value.description.length > 10) {
        localStorage.setItem('feedback_draft', JSON.stringify(currentForm.value));
        draftSaved.value = true;
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('feedback_draft');
      if (draft) {
        const draftData = JSON.parse(draft);
        Object.assign(currentForm.value, draftData);
        draftSaved.value = true;
        return true;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return false;
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem('feedback_draft');
      draftSaved.value = false;
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  const submitForm = async (): Promise<{ success: boolean; issueId?: number; error?: string }> => {
    if (!canSubmit.value) {
      return { success: false, error: 'Form validation failed' };
    }

    isSubmitting.value = true;

    try {
      const response = await submitFeedback(currentForm.value);

      if (response.success && response.data) {
        const submissionRecord: SubmissionRecord = {
          id: crypto.randomUUID(),
          type: determineFormType(),
          title: currentForm.value.description.substring(0, 50) + '...',
          description: currentForm.value.description,
          status: 'submitted',
          submittedAt: new Date(),
          issueId: response.data.issueId,
        };

        submissionHistory.value.unshift(submissionRecord);
        lastSubmissionId.value = submissionRecord.id;

        // Save to localStorage for persistence
        try {
          localStorage.setItem('submission_history', JSON.stringify(submissionHistory.value));
        } catch (error) {
          console.error('Failed to save submission history:', error);
        }

        clearDraft();
        return { success: true, issueId: response.data.issueId };
      } else {
        return { success: false, error: response.message || 'Submission failed' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    } finally {
      isSubmitting.value = false;
    }
  };

  const loadSubmissionHistory = () => {
    try {
      const history = localStorage.getItem('submission_history');
      if (history) {
        submissionHistory.value = JSON.parse(history);
      }
    } catch (error) {
      console.error('Failed to load submission history:', error);
    }
  };

  const determineFormType = (): 'bug' | 'complaint' | 'suggestion' => {
    if (currentForm.value.severity || currentForm.value.environment) {
      return 'bug';
    }
    if (currentForm.value.complaintType || currentForm.value.expectedImprovement) {
      return 'complaint';
    }
    if (currentForm.value.suggestionType || currentForm.value.benefit) {
      return 'suggestion';
    }
    return 'bug'; // default
  };

  return {
    // State
    currentForm,
    submissionHistory,
    isSubmitting,
    lastSubmissionId,
    draftSaved,
    validationErrors,

    // Getters
    hasValidationErrors,
    formProgress,
    canSubmit,

    // Actions
    updateForm,
    resetForm,
    setValidationError,
    clearValidationError,
    clearAllValidationErrors,
    saveDraft,
    loadDraft,
    clearDraft,
    submitForm,
    loadSubmissionHistory,
  };
});
