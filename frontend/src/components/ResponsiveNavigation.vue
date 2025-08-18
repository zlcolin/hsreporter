<template>
  <nav class="responsive-nav" :class="navClasses">
    <!-- Mobile Menu Button -->
    <button
      v-if="isMobile && showMobileToggle"
      class="mobile-menu-toggle"
      @click="toggleMobileMenu"
      :aria-expanded="mobileMenuOpen"
      aria-label="切换导航菜单"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>

    <!-- Navigation Items -->
    <div class="nav-items" :class="{ 'nav-items--open': mobileMenuOpen }">
      <slot />
    </div>

    <!-- Mobile Overlay -->
    <div v-if="isMobile && mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useBreakpoints } from '@/composables/useBreakpoints';

interface Props {
  direction?: 'horizontal' | 'vertical' | 'auto';
  align?: 'start' | 'center' | 'end' | 'between' | 'around';
  showMobileToggle?: boolean;
  mobileBreakpoint?: number;
  sticky?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'auto',
  align: 'start',
  showMobileToggle: true,
  mobileBreakpoint: 768,
  sticky: false,
});

const emit = defineEmits<{
  'mobile-menu-toggle': [open: boolean];
  'mobile-menu-close': [];
}>();

const { isMobile, isTablet, isDesktop, windowWidth } = useBreakpoints();

const mobileMenuOpen = ref(false);

const navClasses = computed(() => ({
  'responsive-nav--mobile': isMobile.value,
  'responsive-nav--tablet': isTablet.value,
  'responsive-nav--desktop': isDesktop.value,
  'responsive-nav--sticky': props.sticky,
  'responsive-nav--mobile-open': mobileMenuOpen.value,
  [`responsive-nav--${props.direction}`]: true,
  [`responsive-nav--align-${props.align}`]: true,
}));

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  emit('mobile-menu-toggle', mobileMenuOpen.value);

  // Prevent body scroll when menu is open
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
  document.body.style.overflow = '';
  emit('mobile-menu-close');
};

// Close mobile menu when screen size changes
const handleResize = () => {
  if (windowWidth.value >= props.mobileBreakpoint && mobileMenuOpen.value) {
    closeMobileMenu();
  }
};

// Close mobile menu on escape key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && mobileMenuOpen.value) {
    closeMobileMenu();
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});

defineExpose({
  toggleMobileMenu,
  closeMobileMenu,
  mobileMenuOpen: readonly(mobileMenuOpen),
});
</script>

<style scoped>
.responsive-nav {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: var(--touch-target-size);
  height: var(--touch-target-size);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: all var(--duration-fast) ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-menu-toggle:hover {
  background-color: var(--color-bg-tertiary);
}

.mobile-menu-toggle:active {
  transform: scale(0.95);
}

.hamburger-line {
  display: block;
  width: 20px;
  height: 2px;
  background-color: var(--color-text-primary);
  margin: 2px 0;
  transition: all var(--duration-normal) ease;
  border-radius: 1px;
}

/* Hamburger Animation */
.responsive-nav--mobile-open .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.responsive-nav--mobile-open .hamburger-line:nth-child(2) {
  opacity: 0;
}

.responsive-nav--mobile-open .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* Navigation Items */
.nav-items {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

/* Direction Variations */
.responsive-nav--horizontal .nav-items {
  flex-direction: row;
}

.responsive-nav--vertical .nav-items {
  flex-direction: column;
  align-items: stretch;
}

.responsive-nav--auto .nav-items {
  flex-direction: row;
}

/* Alignment Variations */
.responsive-nav--align-start .nav-items {
  justify-content: flex-start;
}

.responsive-nav--align-center .nav-items {
  justify-content: center;
}

.responsive-nav--align-end .nav-items {
  justify-content: flex-end;
}

.responsive-nav--align-between .nav-items {
  justify-content: space-between;
}

.responsive-nav--align-around .nav-items {
  justify-content: space-around;
}

/* Sticky Navigation */
.responsive-nav--sticky {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sm);
}

/* Mobile Styles */
.responsive-nav--mobile .mobile-menu-toggle {
  display: flex;
}

.responsive-nav--mobile .nav-items {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-primary);
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  padding: var(--spacing-2xl);
  gap: var(--spacing-lg);
  z-index: var(--z-modal);
  transform: translateX(-100%);
  transition: transform var(--duration-normal) ease;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.responsive-nav--mobile .nav-items--open {
  transform: translateX(0);
}

.responsive-nav--mobile .nav-items :deep(a),
.responsive-nav--mobile .nav-items :deep(button) {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: 500;
  text-align: left;
  width: 100%;
  min-height: var(--touch-target-size);
  display: flex;
  align-items: center;
  transition: all var(--duration-fast) ease;
}

.responsive-nav--mobile .nav-items :deep(a:hover),
.responsive-nav--mobile .nav-items :deep(button:hover) {
  background-color: var(--color-bg-tertiary);
}

.responsive-nav--mobile .nav-items :deep(a:active),
.responsive-nav--mobile .nav-items :deep(button:active) {
  transform: scale(0.98);
}

/* Mobile Overlay */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  opacity: 0;
  animation: fadeIn var(--duration-normal) ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* Tablet Styles */
.responsive-nav--tablet .nav-items {
  gap: var(--spacing-lg);
}

.responsive-nav--tablet .nav-items :deep(a),
.responsive-nav--tablet .nav-items :deep(button) {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
}

/* Desktop Styles */
.responsive-nav--desktop .nav-items {
  gap: var(--spacing-xl);
}

.responsive-nav--desktop .nav-items :deep(a),
.responsive-nav--desktop .nav-items :deep(button) {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-base);
  border-radius: var(--border-radius-md);
  transition: all var(--duration-fast) ease;
}

.responsive-nav--desktop .nav-items :deep(a:hover),
.responsive-nav--desktop .nav-items :deep(button:hover) {
  background-color: var(--color-bg-tertiary);
  transform: translateY(-1px);
}

/* Auto Direction Responsive Behavior */
@media (max-width: 767px) {
  .responsive-nav--auto .nav-items {
    flex-direction: column;
  }
}

/* Focus Styles for Accessibility */
.mobile-menu-toggle:focus {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

.nav-items :deep(a:focus),
.nav-items :deep(button:focus) {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .hamburger-line {
    background-color: var(--color-text-primary);
    height: 3px;
  }

  .mobile-menu-toggle {
    border: 2px solid var(--color-text-primary);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .hamburger-line,
  .nav-items,
  .mobile-overlay {
    transition: none;
  }

  .mobile-overlay {
    animation: none;
    opacity: 1;
  }
}
</style>
