import { useRef, useState, useEffect, useCallback } from 'react';
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

  // Check if user prefers reduced motion
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Cancel any in-flight animation
  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  useEffect(() => {
    // If disabled, reduced motion, or no data, just set directly
    if (!enabled || prefersReducedMotion.current || data.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync data when interpolation disabled
      setInterpolatedData(data);
      prevDataRef.current = data;
      return;
    }

    // If this is the first render with data, set directly
    if (prevDataRef.current.length === 0) {
      setInterpolatedData(data);
      prevDataRef.current = data;
      return;
    }

    // Cancel any existing animation
    cancelAnimation();

    const prevData = prevDataRef.current;
    const newData = data;

    // Calculate how many points to interpolate (from the end)
    const startIndex = Math.max(0, newData.length - maxPoints);

    // Easing function: ease-in-out
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
          // Interpolate numeric values
          result[key] = fromVal + (toVal - fromVal) * progress;
        } else {
          // Pass through non-numeric values
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
  }, [data, duration, enabled, maxPoints, cancelAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimation();
    };
  }, [cancelAnimation]);

  return interpolatedData;
}
