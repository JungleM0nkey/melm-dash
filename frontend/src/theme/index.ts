import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

// Border radius values using CSS custom properties (set by useBorderRadius hook)
const radii = {
  none: '0',
  sm: 'var(--melm-radius-sm, 4px)',
  base: 'var(--melm-radius-md, 8px)',
  md: 'var(--melm-radius-md, 8px)',
  lg: 'var(--melm-radius-lg, 12px)',
  xl: 'var(--melm-radius-xl, 16px)',
  '2xl': 'var(--melm-radius-xl, 16px)',
  '3xl': 'var(--melm-radius-xl, 16px)',
  full: '9999px',
};

// Static colors (same in both light and dark modes)
const colors = {
  // Status colors
  status: {
    running: '#48BB78',
    stopped: '#F56565',
    paused: '#ECC94B',
    restarting: '#4299E1',
    failed: '#F56565',
    unknown: '#A0AEC0',
  },
  // Chart colors (slightly adjusted for light mode via semantic tokens)
  chart: {
    cpu: '#805AD5',
    ram: '#38B2AC',
    download: '#4299E1',
    upload: '#48BB78',
  },
  // Accent colors
  accent: {
    purple: '#805AD5',
    teal: '#38B2AC',
    blue: '#4299E1',
    green: '#48BB78',
  },
};

// Semantic tokens with light/dark variants
const semanticTokens = {
  colors: {
    // Background colors
    'bg.primary': {
      _light: '#ffffff',
      _dark: '#0d0d0d',
    },
    'bg.panel': {
      _light: '#f8f9fa',
      _dark: '#1e1e1e',
    },
    'bg.header': {
      _light: '#f0f1f2',
      _dark: '#141414',
    },
    'bg.hover': {
      _light: '#e9ecef',
      _dark: '#2a2a2a',
    },
    // Foreground/text colors
    'fg.primary': {
      _light: '#1a1a1a',
      _dark: '#f5f5f5',
    },
    'fg.muted': {
      _light: '#6c757d',
      _dark: '#a0a0a0',
    },
    'fg.accent': {
      _light: '#000000',
      _dark: '#ffffff',
    },
    // Border colors
    'border.primary': {
      _light: '#dee2e6',
      _dark: '#2d2d2d',
    },
    'border.hover': {
      _light: '#ced4da',
      _dark: '#3d3d3d',
    },
    // Chart axis colors (for readability)
    'chart.axis': {
      _light: '#6c757d',
      _dark: '#a0a0a0',
    },
    // Chart colors with light mode adjustments (darker for contrast)
    'chart.cpuLine': {
      _light: '#6B46C1',
      _dark: '#805AD5',
    },
    'chart.ramLine': {
      _light: '#2C7A7B',
      _dark: '#38B2AC',
    },
    'chart.downloadLine': {
      _light: '#2B6CB0',
      _dark: '#4299E1',
    },
    'chart.uploadLine': {
      _light: '#276749',
      _dark: '#48BB78',
    },
    // Grid line colors for dashboard background
    'grid.line': {
      _light: 'rgba(0, 0, 0, 0.08)',
      _dark: 'rgba(60, 60, 60, 0.35)',
    },
    'grid.lineDrag': {
      _light: 'rgba(128, 90, 213, 0.15)',
      _dark: 'rgba(128, 90, 213, 0.25)',
    },
    'grid.placeholder': {
      _light: 'rgba(128, 90, 213, 0.3)',
      _dark: 'rgba(128, 90, 213, 0.2)',
    },
  },
};

const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace',
};

const styles = {
  global: {
    'html, body': {
      bg: 'bg.primary',
      color: 'fg.primary',
      lineHeight: 'tall',
    },
    '*::placeholder': {
      color: 'fg.muted',
    },
    '*, *::before, &::after': {
      borderColor: 'border.primary',
    },
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      background: 'bg.primary',
    },
    '::-webkit-scrollbar-thumb': {
      background: 'border.primary',
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: 'border.hover',
    },
  },
};

const components = {
  Card: {
    baseStyle: {
      container: {
        bg: 'bg.panel',
        borderRadius: 'lg',
        borderWidth: '1px',
        borderColor: 'border.primary',
        overflow: 'hidden',
      },
      header: {
        bg: 'bg.header',
        borderBottomWidth: '1px',
        borderColor: 'border.primary',
        py: 2,
        px: 3,
      },
      body: {
        p: 3,
      },
    },
  },
  Badge: {
    variants: {
      running: {
        bg: 'status.running',
        color: 'white',
      },
      stopped: {
        bg: 'status.stopped',
        color: 'white',
      },
      paused: {
        bg: 'status.paused',
        color: 'black',
      },
      restarting: {
        bg: 'status.restarting',
        color: 'white',
      },
    },
  },
  Progress: {
    baseStyle: {
      track: {
        bg: 'bg.header',
      },
    },
    variants: {
      cpu: {
        filledTrack: {
          bg: 'chart.cpu',
        },
      },
      ram: {
        filledTrack: {
          bg: 'chart.ram',
        },
      },
      storage: {
        filledTrack: {
          bg: 'chart.download',
        },
      },
    },
  },
  Table: {
    variants: {
      dashboard: {
        th: {
          color: 'fg.muted',
          fontSize: 'xs',
          fontWeight: 'medium',
          textTransform: 'uppercase',
          letterSpacing: 'wider',
          borderColor: 'border.primary',
          bg: 'bg.header',
        },
        td: {
          fontSize: 'sm',
          borderColor: 'border.primary',
        },
        tr: {
          _hover: {
            bg: 'bg.hover',
          },
        },
      },
    },
  },
  Heading: {
    baseStyle: {
      color: 'fg.primary',
      fontWeight: 'semibold',
    },
  },
  Text: {
    baseStyle: {
      color: 'fg.primary',
    },
    variants: {
      muted: {
        color: 'fg.muted',
      },
      label: {
        color: 'fg.muted',
        fontSize: 'xs',
        textTransform: 'uppercase',
        letterSpacing: 'wider',
      },
    },
  },
};

const layerStyles = {
  panel: {
    bg: 'bg.panel',
    borderRadius: 'lg',
    borderWidth: '1px',
    borderColor: 'border.primary',
  },
  header: {
    bg: 'bg.header',
    borderBottomWidth: '1px',
    borderColor: 'border.primary',
  },
};

const textStyles = {
  panelTitle: {
    fontSize: 'sm',
    fontWeight: 'semibold',
    color: 'fg.primary',
  },
  metric: {
    fontSize: '2xl',
    fontWeight: 'bold',
    color: 'fg.primary',
  },
  metricLabel: {
    fontSize: 'xs',
    color: 'fg.muted',
    textTransform: 'uppercase',
    letterSpacing: 'wider',
  },
};

export const theme = extendTheme({
  config,
  colors,
  radii,
  semanticTokens,
  fonts,
  styles,
  components,
  layerStyles,
  textStyles,
});

export default theme;
