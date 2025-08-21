/**
 * Mobile utility functions for enhanced mobile experience
 */

// Prevent zoom on double tap (iOS Safari)
export function preventZoom(): () => void {
  let lastTouchEnd = 0;

  const handleTouchEnd = (e: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  };

  document.addEventListener('touchend', handleTouchEnd, { passive: false });

  return () => {
    document.removeEventListener('touchend', handleTouchEnd);
  };
}

// Add viewport meta tag for proper mobile scaling
export function setupMobileViewport(): void {
  let viewport = document.querySelector('meta[name="viewport"]');

  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }

  viewport.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
  );
}

// Detect if device is iOS
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Detect if device is Android
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

// Get safe area insets (iOS)
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0,
  };
}

// Haptic feedback (if supported)
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };
    navigator.vibrate(patterns[type]);
  }
}

// Smooth scroll to element
export function smoothScrollTo(element: HTMLElement, offset = 0): void {
  const elementPosition = element.offsetTop - offset;

  window.scrollTo({
    top: elementPosition,
    behavior: 'smooth',
  });
}

// Check if element is in viewport
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Get device orientation
export function getOrientation(): 'portrait' | 'landscape' {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

// Listen for orientation changes
export function onOrientationChange(
  callback: (orientation: 'portrait' | 'landscape') => void
): () => void {
  const handleOrientationChange = () => {
    // Small delay to ensure dimensions are updated
    setTimeout(() => {
      callback(getOrientation());
    }, 100);
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);

  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
}

// Prevent body scroll (useful for modals)
export function preventBodyScroll(): () => void {
  const originalStyle = window.getComputedStyle(document.body);
  const originalOverflow = originalStyle.overflow;
  const originalPaddingRight = originalStyle.paddingRight;

  // Calculate scrollbar width
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth}px`;

  return () => {
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
  };
}

// Format file size for mobile display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Debounce function for touch events
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Copy text to clipboard (mobile-friendly)
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
}

// Share content using Web Share API (mobile)
export async function shareContent(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share(data);
      return true;
    } else {
      // Fallback: copy to clipboard
      const shareText = `${data.title || ''}\n${data.text || ''}\n${data.url || ''}`.trim();
      return await copyToClipboard(shareText);
    }
  } catch (error) {
    console.error('Failed to share content:', error);
    return false;
  }
}

// Check if device has notch (iPhone X and newer)
export function hasNotch(): boolean {
  if (!isIOS()) return false;

  const safeAreaInsets = getSafeAreaInsets();
  return safeAreaInsets.top > 20; // Standard status bar height is 20px
}

// Add CSS class based on device capabilities
export function addDeviceClasses(): void {
  const classes: string[] = [];

  if (isIOS()) classes.push('ios');
  if (isAndroid()) classes.push('android');
  if (hasNotch()) classes.push('has-notch');
  if ('ontouchstart' in window) classes.push('touch-device');
  if (window.DeviceMotionEvent) classes.push('has-motion');
  if (navigator.vibrate) classes.push('has-vibration');
  if (navigator.share) classes.push('has-share-api');

  document.body.classList.add(...classes);
}

// Enhanced mobile keyboard handling
export function handleMobileKeyboard(): () => void {
  const initialViewportHeight = window.innerHeight;

  const handleResize = () => {
    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;

    // If height decreased significantly, keyboard is likely open
    if (heightDifference > 150) {
      document.body.classList.add('keyboard-open');
      document.documentElement.style.setProperty('--keyboard-height', `${heightDifference}px`);
    } else {
      document.body.classList.remove('keyboard-open');
      document.documentElement.style.removeProperty('--keyboard-height');
    }
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
    document.body.classList.remove('keyboard-open');
    document.documentElement.style.removeProperty('--keyboard-height');
  };
}

// Enhanced scroll behavior for mobile
export function enhanceMobileScroll(): () => void {
  // Prevent overscroll bounce on iOS
  const preventOverscroll = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollable = target.closest('.scrollable') || document.body;

    if (scrollable.scrollTop === 0 && e.touches[0].clientY > e.touches[0].clientY) {
      e.preventDefault();
    }

    if (
      scrollable.scrollTop >= scrollable.scrollHeight - scrollable.clientHeight &&
      e.touches[0].clientY < e.touches[0].clientY
    ) {
      e.preventDefault();
    }
  };

  document.addEventListener('touchmove', preventOverscroll, { passive: false });

  return () => {
    document.removeEventListener('touchmove', preventOverscroll);
  };
}

// Enhanced form input handling for mobile
export function enhanceMobileFormInputs(): () => void {
  const inputs = document.querySelectorAll('input, textarea, select');

  const handleFocus = (e: Event) => {
    const target = e.target as HTMLElement;
    target.classList.add('mobile-focused');

    // Scroll input into view on mobile
    if (window.innerWidth <= 767) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  const handleBlur = (e: Event) => {
    const target = e.target as HTMLElement;
    target.classList.remove('mobile-focused');
  };

  inputs.forEach(input => {
    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
  });

  return () => {
    inputs.forEach(input => {
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
    });
  };
}

// Performance optimization for mobile
export function optimizeMobilePerformance(): () => void {
  // Reduce animation frame rate on low-end devices
  const isLowEndDevice =
    navigator.hardwareConcurrency <= 2 || (navigator as unknown).deviceMemory <= 2;

  if (isLowEndDevice) {
    document.body.classList.add('low-end-device');
    document.documentElement.style.setProperty('--animation-duration-multiplier', '0.5');
  }

  // Optimize images for mobile
  const images = document.querySelectorAll('img');
  const imageObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  });

  images.forEach(img => {
    if (img.dataset.src) {
      imageObserver.observe(img);
    }
  });

  return () => {
    imageObserver.disconnect();
    document.body.classList.remove('low-end-device');
    document.documentElement.style.removeProperty('--animation-duration-multiplier');
  };
}

// Enhanced touch gesture detection
export function setupEnhancedTouchGestures(): () => void {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = touchEndTime - touchStartTime;

    // Detect swipe gestures
    if (Math.abs(deltaX) > 50 && deltaTime < 300) {
      const direction = deltaX > 0 ? 'right' : 'left';
      document.dispatchEvent(
        new CustomEvent('swipe', {
          detail: { direction, deltaX, deltaY, deltaTime },
        })
      );
    }

    // Detect long press
    if (deltaTime > 500 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      document.dispatchEvent(
        new CustomEvent('longpress', {
          detail: { x: touchStartX, y: touchStartY, deltaTime },
        })
      );
    }
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
  };
}

// Initialize mobile optimizations
export function initMobileOptimizations(): () => void {
  const cleanupFunctions: Array<() => void> = [];

  // Setup viewport
  setupMobileViewport();

  // Add device classes
  addDeviceClasses();

  // Prevent zoom on double tap
  cleanupFunctions.push(preventZoom());

  // Enhanced mobile features
  cleanupFunctions.push(handleMobileKeyboard());
  cleanupFunctions.push(enhanceMobileScroll());
  cleanupFunctions.push(enhanceMobileFormInputs());
  cleanupFunctions.push(optimizeMobilePerformance());
  cleanupFunctions.push(setupEnhancedTouchGestures());

  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}
