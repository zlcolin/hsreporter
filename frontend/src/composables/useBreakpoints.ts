import { computed, onMounted, onUnmounted, readonly, ref } from 'vue';

export interface Breakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

const defaultBreakpoints: Breakpoints = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1200,
  xl: 1440,
};

const windowWidth = ref(0);

export function useBreakpoints(breakpoints: Breakpoints = defaultBreakpoints) {
  // Update window width
  const updateWidth = () => {
    windowWidth.value = window.innerWidth;
  };

  // Breakpoint checks
  const isXs = computed(() => windowWidth.value < breakpoints.xs);
  const isSm = computed(
    () => windowWidth.value >= breakpoints.xs && windowWidth.value < breakpoints.sm
  );
  const isMd = computed(
    () => windowWidth.value >= breakpoints.sm && windowWidth.value < breakpoints.md
  );
  const isLg = computed(
    () => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg
  );
  const isXl = computed(() => windowWidth.value >= breakpoints.lg);

  // Greater than or equal checks
  const isSmAndUp = computed(() => windowWidth.value >= breakpoints.xs);
  const isMdAndUp = computed(() => windowWidth.value >= breakpoints.sm);
  const isLgAndUp = computed(() => windowWidth.value >= breakpoints.md);
  const isXlAndUp = computed(() => windowWidth.value >= breakpoints.lg);

  // Less than checks
  const isSmAndDown = computed(() => windowWidth.value < breakpoints.sm);
  const isMdAndDown = computed(() => windowWidth.value < breakpoints.md);
  const isLgAndDown = computed(() => windowWidth.value < breakpoints.lg);
  const isXlAndDown = computed(() => windowWidth.value < breakpoints.xl);

  // Current breakpoint name
  const currentBreakpoint = computed(() => {
    if (isXs.value) return 'xs';
    if (isSm.value) return 'sm';
    if (isMd.value) return 'md';
    if (isLg.value) return 'lg';
    return 'xl';
  });

  // Mobile/tablet/desktop checks
  const isMobile = computed(() => windowWidth.value < breakpoints.sm);
  const isTablet = computed(
    () => windowWidth.value >= breakpoints.sm && windowWidth.value < breakpoints.md
  );
  const isDesktop = computed(() => windowWidth.value >= breakpoints.md);

  // Touch device detection
  const isTouchDevice = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  // Responsive value helper
  const getResponsiveValue = <T>(
    values: Partial<Record<keyof Breakpoints | 'base', T>>
  ): T | undefined => {
    const breakpointOrder: (keyof Breakpoints | 'base')[] = ['xl', 'lg', 'md', 'sm', 'xs', 'base'];

    for (const bp of breakpointOrder) {
      if (values[bp] !== undefined) {
        if (bp === 'base') return values[bp];
        if (bp === 'xl' && isXlAndUp.value) return values[bp];
        if (bp === 'lg' && isLgAndUp.value && !isXlAndUp.value) return values[bp];
        if (bp === 'md' && isMdAndUp.value && !isLgAndUp.value) return values[bp];
        if (bp === 'sm' && isSmAndUp.value && !isMdAndUp.value) return values[bp];
        if (bp === 'xs' && !isSmAndUp.value) return values[bp];
      }
    }

    return values.base;
  };

  // Grid columns helper
  const getGridCols = (cols: Partial<Record<keyof Breakpoints | 'base', number>>) => {
    return getResponsiveValue(cols) || 1;
  };

  // Setup event listeners
  onMounted(() => {
    updateWidth();
    window.addEventListener('resize', updateWidth, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth);
  });

  return {
    // Window width
    windowWidth: readonly(windowWidth),

    // Exact breakpoint checks
    isXs: readonly(isXs),
    isSm: readonly(isSm),
    isMd: readonly(isMd),
    isLg: readonly(isLg),
    isXl: readonly(isXl),

    // Range checks
    isSmAndUp: readonly(isSmAndUp),
    isMdAndUp: readonly(isMdAndUp),
    isLgAndUp: readonly(isLgAndUp),
    isXlAndUp: readonly(isXlAndUp),

    isSmAndDown: readonly(isSmAndDown),
    isMdAndDown: readonly(isMdAndDown),
    isLgAndDown: readonly(isLgAndDown),
    isXlAndDown: readonly(isXlAndDown),

    // Device type checks
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    isDesktop: readonly(isDesktop),
    isTouchDevice: readonly(isTouchDevice),

    // Current breakpoint
    currentBreakpoint: readonly(currentBreakpoint),

    // Helpers
    getResponsiveValue,
    getGridCols,

    // Breakpoints config
    breakpoints,
  };
}
