/**
 * useSwipeGestures — Touch gestures para mobile
 * 
 * Detecta swipes horizontal/vertical y permite ejecutar acciones.
 * Útil para navegación mobile, cerrar modals, refresh, etc.
 */

import { useEffect, useRef, useState } from "react";

export interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number; // px mínimos para detectar swipe
  preventScroll?: boolean; // Prevenir scroll durante swipe horizontal
}

export interface SwipeState {
  isSwiping: boolean;
  direction: "left" | "right" | "up" | "down" | null;
  distance: number;
}

export function useSwipeGestures(
  elementRef: React.RefObject<HTMLElement>,
  config: SwipeConfig
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    preventScroll = false,
  } = config;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    distance: 0,
  });

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchEnd.current = null;
      touchStart.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      };
      setSwipeState({ isSwiping: true, direction: null, distance: 0 });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const currentX = e.targetTouches[0].clientX;
      const currentY = e.targetTouches[0].clientY;

      const deltaX = currentX - touchStart.current.x;
      const deltaY = currentY - touchStart.current.y;

      // Determine direction
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      let direction: "left" | "right" | "up" | "down" | null = null;
      let distance = 0;

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        direction = deltaX > 0 ? "right" : "left";
        distance = absDeltaX;

        // Prevent scroll if configured
        if (preventScroll && absDeltaX > 10) {
          e.preventDefault();
        }
      } else {
        // Vertical swipe
        direction = deltaY > 0 ? "down" : "up";
        distance = absDeltaY;
      }

      setSwipeState({ isSwiping: true, direction, distance });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      touchEnd.current = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };

      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = touchEnd.current.y - touchStart.current.y;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Horizontal swipe
      if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }

      // Vertical swipe
      if (absDeltaY > absDeltaX && absDeltaY > minSwipeDistance) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }

      setSwipeState({ isSwiping: false, direction: null, distance: 0 });
      touchStart.current = null;
      touchEnd.current = null;
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: !preventScroll });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    elementRef,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance,
    preventScroll,
  ]);

  return swipeState;
}

/**
 * usePullToRefresh — Pull-to-refresh gesture
 */
export function usePullToRefresh(
  elementRef: React.RefObject<HTMLElement>,
  onRefresh: () => void | Promise<void>,
  options: {
    threshold?: number;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 80, enabled = true } = options;
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const touchStart = useRef<number | null>(null);
  const scrollTop = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      scrollTop.current = element.scrollTop;
      if (scrollTop.current === 0) {
        touchStart.current = e.targetTouches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStart.current === null || scrollTop.current !== 0) return;

      const currentY = e.targetTouches[0].clientY;
      const delta = currentY - touchStart.current;

      if (delta > 0) {
        setPullDistance(delta);
        setIsPulling(true);

        if (delta > threshold) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      if (pullDistance > threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setIsPulling(false);
      setPullDistance(0);
      touchStart.current = null;
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef, enabled, threshold, onRefresh, isPulling, pullDistance]);

  return { isPulling, pullDistance, isRefreshing };
}
