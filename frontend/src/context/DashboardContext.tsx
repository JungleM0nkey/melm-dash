import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  CpuMetrics,
  MemoryMetrics,
  DockerContainer,
  ListeningPort,
  StorageDrive,
  NetworkMetrics,
  SystemService,
  SystemInfo,
  TimeSeriesPoint,
  ConnectionStatus,
  CpuPayload,
  MemoryPayload,
  NetworkPayload,
  InitialPayload,
} from '@melm-dash/shared-types';
import { createWebSocketClient, type WebSocketClient } from '../services/websocket';

// State interface
export interface DashboardState {
  // Connection
  connectionStatus: ConnectionStatus;
  lastUpdate: number | null;

  // Current metrics
  cpu: CpuMetrics | null;
  memory: MemoryMetrics | null;
  docker: DockerContainer[];
  ports: ListeningPort[];
  storage: StorageDrive[];
  network: NetworkMetrics | null;
  services: SystemService[];
  system: SystemInfo | null;

  // Historical data
  cpuHistory: TimeSeriesPoint<number>[];
  memoryHistory: TimeSeriesPoint<number>[];
  networkHistory: TimeSeriesPoint<{ download: number; upload: number }>[];
}

// Action types
type DashboardAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: ConnectionStatus }
  | { type: 'SET_INITIAL'; payload: InitialPayload }
  | { type: 'SET_CPU'; payload: CpuPayload }
  | { type: 'SET_MEMORY'; payload: MemoryPayload }
  | { type: 'SET_DOCKER'; payload: DockerContainer[] }
  | { type: 'SET_PORTS'; payload: ListeningPort[] }
  | { type: 'SET_STORAGE'; payload: StorageDrive[] }
  | { type: 'SET_NETWORK'; payload: NetworkPayload }
  | { type: 'SET_SERVICES'; payload: SystemService[] }
  | { type: 'SET_SYSTEM'; payload: SystemInfo }
  | { type: 'RESET' };

// Initial state
const initialState: DashboardState = {
  connectionStatus: 'disconnected',
  lastUpdate: null,
  cpu: null,
  memory: null,
  docker: [],
  ports: [],
  storage: [],
  network: null,
  services: [],
  system: null,
  cpuHistory: [],
  memoryHistory: [],
  networkHistory: [],
};

// Reducer
function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };

    case 'SET_INITIAL':
      return {
        ...state,
        cpu: action.payload.cpu,
        memory: action.payload.memory,
        docker: action.payload.docker,
        ports: action.payload.ports,
        storage: action.payload.storage,
        network: action.payload.network,
        services: action.payload.services,
        system: action.payload.system,
        cpuHistory: action.payload.cpuHistory,
        memoryHistory: action.payload.memoryHistory,
        networkHistory: action.payload.networkHistory,
        lastUpdate: Date.now(),
      };

    case 'SET_CPU':
      return {
        ...state,
        cpu: {
          usage: action.payload.usage,
          cores: action.payload.cores,
          model: action.payload.model,
          speed: action.payload.speed,
        },
        cpuHistory: action.payload.history,
        lastUpdate: Date.now(),
      };

    case 'SET_MEMORY':
      return {
        ...state,
        memory: {
          usage: action.payload.usage,
          used: action.payload.used,
          total: action.payload.total,
          available: action.payload.available,
        },
        memoryHistory: action.payload.history,
        lastUpdate: Date.now(),
      };

    case 'SET_DOCKER':
      return { ...state, docker: action.payload, lastUpdate: Date.now() };

    case 'SET_PORTS':
      return { ...state, ports: action.payload, lastUpdate: Date.now() };

    case 'SET_STORAGE':
      return { ...state, storage: action.payload, lastUpdate: Date.now() };

    case 'SET_NETWORK':
      return {
        ...state,
        network: {
          download: action.payload.download,
          upload: action.payload.upload,
          interfaces: action.payload.interfaces,
        },
        networkHistory: action.payload.history,
        lastUpdate: Date.now(),
      };

    case 'SET_SERVICES':
      return { ...state, services: action.payload, lastUpdate: Date.now() };

    case 'SET_SYSTEM':
      return { ...state, system: action.payload, lastUpdate: Date.now() };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context interface
interface DashboardContextValue {
  state: DashboardState;
  connect: () => void;
  disconnect: () => void;
}

// Create context
const DashboardContext = createContext<DashboardContextValue | null>(null);

// Provider props
interface DashboardProviderProps {
  children: ReactNode;
  host?: string;
  port?: number;
}

// Provider component
export function DashboardProvider({
  children,
  host,
  port = 3001,
}: DashboardProviderProps) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const mountedRef = useRef(true);

  // Use refs to avoid recreating callbacks when these change
  const hostRef = useRef(host);
  const portRef = useRef(port);

  // Update refs when props change
  useEffect(() => {
    hostRef.current = host;
    portRef.current = port;
  }, [host, port]);

  // Stable dispatch wrapper that checks mounted state
  const safeDispatch = useCallback((action: DashboardAction) => {
    if (mountedRef.current) {
      dispatch(action);
    }
  }, []);

  const setupMessageHandlers = useCallback((client: WebSocketClient) => {
    client.on('initial', (payload) => {
      safeDispatch({ type: 'SET_INITIAL', payload });
    });

    client.on('cpu', (payload) => {
      safeDispatch({ type: 'SET_CPU', payload });
    });

    client.on('memory', (payload) => {
      safeDispatch({ type: 'SET_MEMORY', payload });
    });

    client.on('docker', (payload) => {
      safeDispatch({ type: 'SET_DOCKER', payload });
    });

    client.on('ports', (payload) => {
      safeDispatch({ type: 'SET_PORTS', payload });
    });

    client.on('storage', (payload) => {
      safeDispatch({ type: 'SET_STORAGE', payload });
    });

    client.on('network', (payload) => {
      safeDispatch({ type: 'SET_NETWORK', payload });
    });

    client.on('services', (payload) => {
      safeDispatch({ type: 'SET_SERVICES', payload });
    });

    client.on('system', (payload) => {
      safeDispatch({ type: 'SET_SYSTEM', payload });
    });
  }, [safeDispatch]);

  // Stable connect function using refs
  const connect = useCallback(() => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
    }

    const client = createWebSocketClient(
      hostRef.current,
      portRef.current,
      (status) => {
        safeDispatch({ type: 'SET_CONNECTION_STATUS', payload: status });
      }
    );

    setupMessageHandlers(client);
    client.connect();
    wsClientRef.current = client;
  }, [setupMessageHandlers, safeDispatch]);

  // Stable disconnect function
  const disconnect = useCallback(() => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }
    safeDispatch({ type: 'RESET' });
  }, [safeDispatch]);

  // Auto-connect on mount, cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  // Reconnect when host/port changes
  useEffect(() => {
    // Skip on initial mount (handled by main effect)
    if (wsClientRef.current && mountedRef.current) {
      connect();
    }
  }, [host, port, connect]);

  // Memoize the context value to prevent unnecessary re-renders
  // Note: state changes will still trigger re-renders for all consumers
  // For finer-grained updates, consider using zustand or use-context-selector
  const value = useMemo<DashboardContextValue>(
    () => ({
      state,
      connect,
      disconnect,
    }),
    [state, connect, disconnect]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook
export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// Selector hooks for optimized re-renders
export function useCpu() {
  const { state } = useDashboard();
  return { cpu: state.cpu, history: state.cpuHistory };
}

export function useMemory() {
  const { state } = useDashboard();
  return { memory: state.memory, history: state.memoryHistory };
}

export function useDocker() {
  const { state } = useDashboard();
  return state.docker;
}

export function usePorts() {
  const { state } = useDashboard();
  return state.ports;
}

export function useStorage() {
  const { state } = useDashboard();
  return state.storage;
}

export function useNetwork() {
  const { state } = useDashboard();
  return { network: state.network, history: state.networkHistory };
}

export function useServices() {
  const { state } = useDashboard();
  return state.services;
}

export function useSystemInfo() {
  const { state } = useDashboard();
  return state.system;
}

export function useConnectionStatus() {
  const { state } = useDashboard();
  return state.connectionStatus;
}
