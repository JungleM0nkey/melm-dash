import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const colors = {
  // Background colors
  bg: {
    primary: '#0d0d0d',
    panel: '#1e1e1e',
    header: '#141414',
    hover: '#2a2a2a',
  },
  // Foreground/text colors
  fg: {
    primary: '#f5f5f5',
    muted: '#a0a0a0',
    accent: '#ffffff',
  },
  // Border colors
  border: {
    primary: '#2d2d2d',
    hover: '#3d3d3d',
  },
  // Status colors
  status: {
    running: '#48BB78',
    stopped: '#F56565',
    paused: '#ECC94B',
    restarting: '#4299E1',
    failed: '#F56565',
    unknown: '#A0AEC0',
  },
  // Chart colors
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
  fonts,
  styles,
  components,
  layerStyles,
  textStyles,
});

export default theme;
