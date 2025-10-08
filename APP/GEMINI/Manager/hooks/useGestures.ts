import { useDrag, useGesture } from '@use-gesture/react';
import { useRef } from 'react';

export interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
}

export function useSwipeGesture(handlers: GestureHandlers) {
  const bind = useDrag(
    ({ movement: [mx, my], velocity: [vx], direction: [dx], cancel, tap }) => {
      // Tap detection
      if (tap && handlers.onTap) {
        handlers.onTap();
        return;
      }

      // Swipe threshold
      const swipeThreshold = 50;
      const velocityThreshold = 0.5;

      // Horizontal swipes
      if (Math.abs(mx) > swipeThreshold && Math.abs(vx) > velocityThreshold) {
        if (dx > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
          cancel();
        } else if (dx < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
          cancel();
        }
      }

      // Vertical swipes
      if (Math.abs(my) > swipeThreshold) {
        if (my > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
          cancel();
        } else if (my < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
          cancel();
        }
      }
    },
    {
      filterTaps: true,
      axis: undefined, // Allow both axes
    }
  );

  return bind;
}

export function useLongPress(onLongPress: () => void, delay = 500) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const bind = useGesture({
    onPointerDown: () => {
      timeoutRef.current = setTimeout(() => {
        onLongPress();
        // Haptic feedback if supported
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }, delay);
    },
    onPointerUp: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    onPointerLeave: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
  });

  return bind;
}

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const isRefreshing = useRef(false);
  const startY = useRef(0);

  const bind = useDrag(
    async ({ movement: [, my], first, last, velocity: [, vy] }) => {
      if (first) {
        startY.current = my;
      }

      // Only trigger if pulling down from top
      if (my > 0 && window.scrollY === 0) {
        const pullDistance = my;
        const threshold = 80;

        if (last && pullDistance > threshold && vy > 0.5 && !isRefreshing.current) {
          isRefreshing.current = true;
          
          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }

          try {
            await onRefresh();
          } finally {
            isRefreshing.current = false;
          }
        }
      }
    },
    {
      axis: 'y',
      filterTaps: true,
    }
  );

  return { bind, isRefreshing: isRefreshing.current };
}
