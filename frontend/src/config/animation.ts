/**
 * Centralized configuration for chart animations.
 *
 * Animation timing is based on the shortest polling interval (2000ms for CPU/Network).
 * Using 800ms duration (40% of interval) leaves a 1200ms buffer before next update.
 */
export const chartAnimationConfig = {
  /** Animation duration in milliseconds */
  duration: 800,

  /** Easing function for animations */
  easing: 'ease-in-out' as const,

  /** Skip animation on initial render to avoid slow load */
  skipInitial: true,

  /** Only interpolate last N points for performance (visible portion) */
  interpolationWindow: 60,

  /** Respect user's reduced motion preference */
  respectReducedMotion: true,
} as const;

export type ChartAnimationConfig = typeof chartAnimationConfig;
