import { computed, ref } from 'vue';
import { useBreakpoints } from './useBreakpoints';

export interface TouchGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  duration: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

export interface SwipeOptions {
  threshold?: number;
  velocity?: number;
  preventScroll?: boolean;
}

export function useMobileInteractions() {
  const { isMobile, isTouchDevice } = useBreakpoints();

  // Touch state
  const isTouch = ref(false);
  const touchStart = ref<{ x: number; y: number; time: number } | null>(null);
  const touchEnd = ref<{ x: number; y: number; time: number } | null>(null);

  // Gesture detection
  const detectSwipe = (
    element: HTMLElement,
    callback: (gesture: TouchGesture) => void,
    options: SwipeOptions = {}
  ) => {
    const { threshold = 50, velocity = 0.3, preventScroll = false } = options;

    let startTouch: Touch | null = null;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (preventScroll) {
        e.preventDefault();
      }

      startTouch = e.touches[0];
      startTime = Date.now();
      touchStart.value = {
        x: startTouch.clientX,
        y: startTouch.clientY,
        time: startTime,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startTouch || !touchStart.value) return;

      const endTouch = e.changedTouches[0];
      const endTime = Date.now();
      const duration = endTime - startTime;

      const deltaX = endTouch.clientX - startTouch.clientX;
      const deltaY = endTouch.clientY - startTouch.clientY;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Check if gesture meets threshold requirements
      if (Math.max(absX, absY) < threshold) return;

      // Check velocity
      const velocityX = absX / duration;
      const velocityY = absY / duration;

      if (Math.max(velocityX, velocityY) < velocity) return;

      // Determine direction
      let direction: TouchGesture['direction'] = null;
      if (absX > absY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      const gesture: TouchGesture = {
        startX: touchStart.value.x,
        startY: touchStart.value.y,
        endX: endTouch.clientX,
        endY: endTouch.clientY,
        deltaX,
        deltaY,
        duration,
        direction,
      };

      callback(gesture);

      touchEnd.value = {
        x: endTouch.clientX,
        y: endTouch.clientY,
        time: endTime,
      };
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  };

  // Pull to refresh functionality
  const setupPullToRefresh = (
    element: HTMLElement,
    callback: () => Promise<void>,
    threshold = 80
  ) => {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let isRefreshing = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 0 && element.scrollTop === 0) {
        e.preventDefault();

        // Add visual feedback
        const pullRatio = Math.min(pullDistance / threshold, 1);
        element.style.transform = `translateY(${pullDistance * 0.5}px)`;
        element.style.opacity = String(1 - pullRatio * 0.2);

        if (pullDistance > threshold) {
          element.classList.add('pull-to-refresh', 'pulling');
        } else {
          element.classList.remove('pulling');
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      const pullDistance = currentY - startY;

      if (pullDistance > threshold && !isRefreshing) {
        isRefreshing = true;

        try {
          await callback();
        } finally {
          isRefreshing = false;
        }
      }

      // Reset visual state
      element.style.transform = '';
      element.style.opacity = '';
      element.classList.remove('pull-to-refresh', 'pulling');

      isPulling = false;
      startY = 0;
      currentY = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  };

  // Long press detection
  const detectLongPress = (
    element: HTMLElement,
    callback: (e: TouchEvent | MouseEvent) => void,
    duration = 500
  ) => {
    let timer: number | null = null;
    let isPressed = false;

    const start = (e: TouchEvent | MouseEvent) => {
      isPressed = true;
      timer = window.setTimeout(() => {
        if (isPressed) {
          callback(e);
        }
      }, duration);
    };

    const end = () => {
      isPressed = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    // Touch events
    element.addEventListener('touchstart', start, { passive: true });
    element.addEventListener('touchend', end, { passive: true });
    element.addEventListener('touchcancel', end, { passive: true });

    // Mouse events for desktop testing
    element.addEventListener('mousedown', start);
    element.addEventListener('mouseup', end);
    element.addEventListener('mouseleave', end);

    return () => {
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchend', end);
      element.removeEventListener('touchcancel', end);
      element.removeEventListener('mousedown', start);
      element.removeEventListener('mouseup', end);
      element.removeEventListener('mouseleave', end);

      if (timer) {
        clearTimeout(timer);
      }
    };
  };

  // Haptic feedback (if supported)
  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Double tap detection
  const detectDoubleTap = (
    element: HTMLElement,
    callback: (e: TouchEvent | MouseEvent) => void,
    delay = 300
  ) => {
    let lastTap = 0;

    const handleTap = (e: TouchEvent | MouseEvent) => {
      const currentTime = Date.now();
      const tapLength = currentTime - lastTap;

      if (tapLength < delay && tapLength > 0) {
        callback(e);
        lastTap = 0; // Reset to prevent triple tap
      } else {
        lastTap = currentTime;
      }
    };

    element.addEventListener('touchend', handleTap, { passive: true });
    element.addEventListener('click', handleTap);

    return () => {
      element.removeEventListener('touchend', handleTap);
      element.removeEventListener('click', handleTap);
    };
  };

  // Pinch zoom detection
  const detectPinch = (
    element: HTMLElement,
    callback: (scale: number, center: { x: number; y: number }) => void
  ) => {
    let initialDistance = 0;
    // let _initialScale = 1; // Commented out as it's not used

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (touch1: Touch, touch2: Touch) => ({
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialScale = 1;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        e.preventDefault();

        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        const center = getCenter(e.touches[0], e.touches[1]);

        callback(scale, center);
      }
    };

    const handleTouchEnd = () => {
      initialDistance = 0;
      initialScale = 1;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  };

  // Check if device supports touch
  const supportsTouchEvents = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  // Check if device is likely mobile
  const isMobileDevice = computed(() => {
    return isMobile.value && supportsTouchEvents.value;
  });

  // Prevent zoom on double tap (iOS Safari)
  const preventZoom = () => {
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
  };

  return {
    // State
    isTouch: readonly(isTouch),
    touchStart: readonly(touchStart),
    touchEnd: readonly(touchEnd),

    // Computed
    supportsTouchEvents,
    isMobileDevice,
    isTouchDevice,

    // Methods
    detectSwipe,
    setupPullToRefresh,
    detectLongPress,
    detectDoubleTap,
    detectPinch,
    hapticFeedback,
    preventZoom,
  };
}
