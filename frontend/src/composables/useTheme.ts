import { computed, onMounted, readonly, ref, watch } from 'vue';

export type Theme = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'hsreporter-theme';

// Global theme state
const currentTheme = ref<Theme>('auto');
const systemPrefersDark = ref(false);

export function useTheme() {
  // Computed theme based on current setting and system preference
  const resolvedTheme = computed(() => {
    if (currentTheme.value === 'auto') {
      return systemPrefersDark.value ? 'dark' : 'light';
    }
    return currentTheme.value;
  });

  // Check if dark theme is active
  const isDark = computed(() => resolvedTheme.value === 'dark');

  // Initialize theme
  const initTheme = () => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark.value = mediaQuery.matches;

    // Listen for system theme changes
    mediaQuery.addEventListener('change', e => {
      systemPrefersDark.value = e.matches;
    });

    // Load saved theme preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      currentTheme.value = savedTheme;
    }

    // Apply theme to document
    applyTheme();
  };

  // Apply theme to document
  const applyTheme = () => {
    const root = document.documentElement;

    // Remove existing theme attributes
    root.removeAttribute('data-theme');

    // Apply new theme
    if (currentTheme.value !== 'auto') {
      root.setAttribute('data-theme', currentTheme.value);
    }

    // Add theme class for Element Plus
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${resolvedTheme.value}`);
  };

  // Set theme
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme();
  };

  // Toggle between light and dark (skips auto)
  const toggleTheme = () => {
    const newTheme = resolvedTheme.value === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Cycle through all themes
  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(currentTheme.value);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Get theme display name
  const getThemeDisplayName = (theme: Theme) => {
    const names = {
      light: '浅色主题',
      dark: '深色主题',
      auto: '跟随系统',
    };
    return names[theme];
  };

  // Watch for theme changes
  watch(resolvedTheme, applyTheme);

  // Initialize on mount
  onMounted(initTheme);

  return {
    currentTheme: readonly(currentTheme),
    resolvedTheme: readonly(resolvedTheme),
    isDark: readonly(isDark),
    systemPrefersDark: readonly(systemPrefersDark),
    setTheme,
    toggleTheme,
    cycleTheme,
    getThemeDisplayName,
    initTheme,
  };
}

// Export for use in other composables
export { currentTheme, systemPrefersDark };
