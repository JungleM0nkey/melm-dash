import { useRef, useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { chartAnimationConfig } from '../config/animation';

export interface UseInterpolatedDataOptions {
  /** Animation duration in milliseconds (default: from config) */
  duration?: number;
  /** Enable/disable interpolation (default: true) */
  enabled?: boolean;
  /** Only interpolate last N points for performance (default: from config) */
  maxPoints?: number;
}

type NumericRecord = Record<string, number | unknown>;

/**
 * Subscribe to reduced motion preference changes.
 * Returns true if user prefers reduced motion.
 */
function subscribeToReducedMotion(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * Subscribe to tab visibility changes.
 * Returns true if tab is visible.
 */
function subscribeToVisibility(callback: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
}

function getVisibilitySnapshot(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState === 'visible';
}

function getVisibilityServerSnapshot(): boolean {
  return true;
}

/**
 * Hook that smoothly interpolates between old and new data values
 * using requestAnimationFrame for 60fps animations.
 *
 * Only numeric values are interpolated; non-numeric values are passed through.
 */
export function useInterpolatedData<T extends NumericRecord>(
  data: T[],
  options: UseInterpolatedDataOptions = {}
): T[] {
  const {
    duration = chartAnimationConfig.duration,
    enabled = true,
    maxPoints = chartAnimationConfig.interpolationWindow,
  } = options;

  const [interpolatedData, setInterpolatedData] = useState<T[]>(data);
  const prevDataRef = useRef<T[]>(data);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isFirstRenderRef = useRef(true);

  // Reactively track reduced motion preference
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // Reactively track tab visibility
  const isTabVisible = useSyncExternalStore(
    subscribeToVisibility,
    getVisibilitySnapshot,
    getVisibilityServerSnapshot
  );

  // Determine if animations should run
  // If respectReducedMotion is true, we check the preference; otherwise we animate regardless
  const shouldAnimate =
    enabled &&
    isTabVisible &&
    (!chartAnimationConfig.respectReducedMotion || !prefersReducedMotion);

  // Cancel any in-flight animation
  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  useEffect(() => {
    // Skip animation on first render if configured
    const skipThisRender =
      isFirstRenderRef.current && chartAnimationConfig.skipInitial;

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
    }

    // If we shouldn't animate, set data directly
    if (!shouldAnimate || data.length === 0 || skipThisRender) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInterpolatedData(data);
      prevDataRef.current = data;
      cancelAnimation();
      return;
    }

    // If no previous data to interpolate from, set directly
    if (prevDataRef.current.length === 0) {
      setInterpolatedData(data);
      prevDataRef.current = data;
      return;
    }

    // Cancel any existing animation before starting new one
    cancelAnimation();

    const prevData = prevDataRef.current;
    const newData = data;

    // Calculate how many points to interpolate (from the end)
    const startIndex = Math.max(0, newData.length - maxPoints);

    // Easing function: ease-in-out quadratic
    const easeInOut = (t: number): number => {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };

    // Interpolate numeric values between two objects
    const interpolateObject = (
      from: T | undefined,
      to: T,
      progress: number
    ): T => {
      if (!from) return to;

      const result: NumericRecord = {};
      for (const key of Object.keys(to)) {
        const fromVal = from[key];
        const toVal = to[key];

        if (typeof fromVal === 'number' && typeof toVal === 'number') {
          result[key] = fromVal + (toVal - fromVal) * progress;
        } else {
          result[key] = toVal;
        }
      }
      return result as T;
    };

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);
      const progress = easeInOut(rawProgress);

      // Build interpolated data array
      const result: T[] = newData.map((newPoint, index) => {
        // Only interpolate points within the window
        if (index < startIndex) {
          return newPoint;
        }

        // Find corresponding point in previous data
        const prevIndex = index - (newData.length - prevData.length);
        const prevPoint = prevIndex >= 0 ? prevData[prevIndex] : undefined;

        return interpolateObject(prevPoint, newPoint, progress);
      });

      setInterpolatedData(result);

      // Continue animation if not complete
      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete, update reference
        prevDataRef.current = newData;
        animationFrameRef.current = null;
        startTimeRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimation();
    };
  }, [data, duration, shouldAnimate, maxPoints, cancelAnimation]);

  // Pause animation when tab becomes hidden
  useEffect(() => {
    if (!isTabVisible && animationFrameRef.current !== null) {
      // Tab hidden mid-animation: cancel and snap to final state
      cancelAnimation();
      setInterpolatedData(prevDataRef.current);
    }
  }, [isTabVisible, cancelAnimation]);

  return interpolatedData;
}
