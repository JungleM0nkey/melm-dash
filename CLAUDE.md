# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

melm-dash is a real-time Linux system monitoring dashboard with a React frontend and Fastify backend. It displays CPU, memory, network, Docker, storage, services, and ports via WebSocket updates.

## Commands

```bash
# Install dependencies (pnpm required)
pnpm install

# Development - Native (runs backend and frontend concurrently)
pnpm dev

# Development - Docker with hot reload
pnpm dev:docker         # Start development container
pnpm dev:docker:down    # Stop development container

# Build all packages (shared-types must build first)
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run all tests
pnpm test

# Run single package tests
pnpm --filter @melm-dash/backend test
pnpm --filter @melm-dash/frontend test

# Run tests in watch mode
pnpm --filter @melm-dash/backend test:watch

# Run tests with coverage
pnpm --filter @melm-dash/backend test:coverage

# Docker production deployment
docker compose build
docker compose up -d

# Docker development deployment (alternative to pnpm dev:docker)
docker compose -f docker-compose.dev.yml up --build
docker compose -f docker-compose.dev.yml down
```

## Architecture

### Monorepo Structure (pnpm workspaces)

```
packages/shared-types/    # TypeScript types shared between frontend and backend
backend/                  # Fastify server with WebSocket, metric collectors
frontend/                 # React dashboard with Chakra UI
```

### Build Order

`@melm-dash/shared-types` must be built before backend/frontend. The root `pnpm build` handles this automatically.

### Backend Architecture

- **Entry**: `backend/src/index.ts` - Fastify server with security middleware (helmet, CORS, rate limiting)
- **Collectors** (`backend/src/collectors/`): Each file collects one metric type (cpu, memory, docker, etc.) using the `systeminformation` library
- **Scheduler** (`backend/src/services/scheduler.ts`): Orchestrates collectors at configured intervals, broadcasts updates
- **Broadcast Manager** (`backend/src/services/broadcast.ts`): Manages WebSocket connections and message broadcasting
- **Metrics Store** (`backend/src/services/metrics-store.ts`): In-memory storage with time-series history
- **DI Container** (`backend/src/container/index.ts`): Simple dependency injection for services
- **Config** (`backend/src/config.ts`): Environment-based configuration via Zod validation

### Frontend Architecture

- **Entry**: `frontend/src/App.tsx` - ChakraProvider + DashboardProvider wrapper
- **State**: `frontend/src/context/DashboardContext.tsx` - useReducer pattern with WebSocket integration
- **WebSocket Client**: `frontend/src/services/websocket.ts` - Reconnection with exponential backoff
- **Panels** (`frontend/src/components/panels/`): Each panel displays one metric type
- **Charts** (`frontend/src/components/charts/`): Recharts-based visualizations
- **Layout** (`frontend/src/components/layout/`): react-grid-layout for drag-and-drop

### Data Flow

1. Scheduler triggers collectors at intervals
2. Collectors fetch data via systeminformation
3. MetricsStore updates state and history
4. BroadcastManager sends WebSocket messages
5. Frontend DashboardContext dispatches actions to update React state
6. Panels re-render with new data

### Type Safety

All WebSocket messages use types from `@melm-dash/shared-types`. The `TypedWebSocketMessage` discriminated union enables type-safe message handling.

## Testing

- **Framework**: Vitest
- **Backend**: Node environment, tests in `*.test.ts` files
- **Frontend**: jsdom environment with React Testing Library
- **Test files**: Located alongside source files (e.g., `validation.test.ts`)

## Docker Deployment

The app runs in Docker with access to host system metrics. Before deploying, check your Docker group GID:
```bash
getent group docker | cut -d: -f3
```
Update `group_add` in `docker-compose.yml` with this value.
