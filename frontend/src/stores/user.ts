import type { ContactInfo, UserPreferences } from '@/types/store';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  // State
  const preferences = ref<UserPreferences>({
    autoSaveDraft: true,
    notificationEnabled: true,
    defaultFormType: 'bug',
    rememberContactInfo: true,
  });

  const contactInfo = ref<ContactInfo>({
    email: '',
    phone: '',
    hsId: '',
  });

  const sessionId = ref<string | null>(null);

  // Getters
  const hasContactInfo = computed(() => {
    return !!(contactInfo.value.email || contactInfo.value.phone || contactInfo.value.hsId);
  });

  const isValidEmail = computed(() => {
    return !contactInfo.value.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.value.email);
  });

  const isValidPhone = computed(() => {
    return !contactInfo.value.phone || /^1[3-9]\d{9}$/.test(contactInfo.value.phone);
  });

  const isValidHsId = computed(() => {
    return !contactInfo.value.hsId || /^\d{11}$/.test(contactInfo.value.hsId);
  });

  const hasValidContactInfo = computed(() => {
    return isValidEmail.value && isValidPhone.value && isValidHsId.value;
  });

  // Actions
  const updatePreferences = (updates: Partial<UserPreferences>) => {
    Object.assign(preferences.value, updates);
    savePreferences();
  };

  const updateContactInfo = (updates: Partial<ContactInfo>) => {
    Object.assign(contactInfo.value, updates);
    if (preferences.value.rememberContactInfo) {
      saveContactInfo();
    }
  };

  const clearContactInfo = () => {
    contactInfo.value = {
      email: '',
      phone: '',
      hsId: '',
    };
    localStorage.removeItem('user_contact_info');
  };

  const savePreferences = () => {
    try {
      localStorage.setItem('user_preferences', JSON.stringify(preferences.value));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  };

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('user_preferences');
      if (saved) {
        const savedPreferences = JSON.parse(saved);
        Object.assign(preferences.value, savedPreferences);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  const saveContactInfo = () => {
    try {
      if (preferences.value.rememberContactInfo) {
        localStorage.setItem('user_contact_info', JSON.stringify(contactInfo.value));
      }
    } catch (error) {
      console.error('Failed to save contact info:', error);
    }
  };

  const loadContactInfo = () => {
    try {
      if (preferences.value.rememberContactInfo) {
        const saved = localStorage.getItem('user_contact_info');
        if (saved) {
          const savedContactInfo = JSON.parse(saved);
          Object.assign(contactInfo.value, savedContactInfo);
        }
      }
    } catch (error) {
      console.error('Failed to load contact info:', error);
    }
  };

  const generateSessionId = () => {
    sessionId.value = crypto.randomUUID();
    return sessionId.value;
  };

  const clearSession = () => {
    sessionId.value = null;
  };

  const initializeUser = () => {
    loadPreferences();
    loadContactInfo();
    generateSessionId();
  };

  const resetUserData = () => {
    preferences.value = {
      autoSaveDraft: true,
      notificationEnabled: true,
      defaultFormType: 'bug',
      rememberContactInfo: true,
    };
    clearContactInfo();
    clearSession();

    // Clear localStorage
    localStorage.removeItem('user_preferences');
    localStorage.removeItem('user_contact_info');
  };

  // Validation helpers
  const validateEmail = (email: string): string[] => {
    const errors: string[] = [];
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('邮箱格式不正确');
    }
    return errors;
  };

  const validatePhone = (phone: string): string[] => {
    const errors: string[] = [];
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      errors.push('手机号格式不正确');
    }
    return errors;
  };

  const validateHsId = (hsId: string): string[] => {
    const errors: string[] = [];
    if (hsId && !/^\d{11}$/.test(hsId)) {
      errors.push('学号格式不正确（应为11位数字）');
    }
    return errors;
  };

  return {
    // State
    preferences,
    contactInfo,
    sessionId,

    // Getters
    hasContactInfo,
    isValidEmail,
    isValidPhone,
    isValidHsId,
    hasValidContactInfo,

    // Actions
    updatePreferences,
    updateContactInfo,
    clearContactInfo,
    savePreferences,
    loadPreferences,
    saveContactInfo,
    loadContactInfo,
    generateSessionId,
    clearSession,
    initializeUser,
    resetUserData,

    // Validation helpers
    validateEmail,
    validatePhone,
    validateHsId,
  };
});
