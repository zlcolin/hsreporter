// Composable for accessing all stores
import { useAppStore, useFeedbackStore, useUserStore } from '@/stores';

export function useStores() {
  const feedbackStore = useFeedbackStore();
  const appStore = useAppStore();
  const userStore = useUserStore();

  return {
    feedbackStore,
    appStore,
    userStore,
  };
}

// Individual store composables for convenience
export function useFeedback() {
  return useFeedbackStore();
}

export function useApp() {
  return useAppStore();
}

export function useUser() {
  return useUserStore();
}
