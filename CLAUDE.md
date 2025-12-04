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

## Reducer Pattern Best Practices

When working with reducers in `frontend/src/context/DashboardContext.tsx` that handle payloads containing both metrics and additional fields (like `history`), follow these patterns to ensure type safety and maintainability:

### ✅ Recommended Pattern: Destructuring

Use object destructuring to separate payload fields. This automatically includes all current and future fields without manual enumeration:

```typescript
case 'SET_CPU': {
  const { history, ...cpuMetrics } = action.payload;
  return {
    ...state,
    cpu: cpuMetrics,        // Includes ALL CpuMetrics fields automatically
    cpuHistory: history,
    lastUpdate: Date.now(),
  };
}

case 'SET_MEMORY': {
  const { history, ...memoryMetrics } = action.payload;
  return {
    ...state,
    memory: memoryMetrics,  // Includes ALL MemoryMetrics fields automatically
    memoryHistory: history,
    lastUpdate: Date.now(),
  };
}
```

**Benefits**:
- **Future-proof**: Automatically includes new fields added to CpuMetrics/MemoryMetrics
- **Type-safe**: TypeScript catches missing required fields at compile time
- **DRY**: No need to enumerate each field manually
- **Consistent**: Matches pattern used in other reducers (SET_INITIAL, SET_NETWORK)

### ❌ Anti-Pattern: Manual Field Enumeration

**Avoid** manually listing each field - this is fragile when types evolve:

```typescript
// DON'T DO THIS - breaks when CpuMetrics type changes
case 'SET_CPU':
  return {
    ...state,
    cpu: {
      usage: action.payload.usage,
      cores: action.payload.cores,
      model: action.payload.model,
      speed: action.payload.speed,
      // ⚠️ Easy to forget new fields like physicalCores
    },
    cpuHistory: action.payload.history,
    lastUpdate: Date.now(),
  };
```

**Problems**:
- Adding fields to shared types breaks compilation silently
- Manual maintenance required for every type change
- Easy to introduce bugs during refactoring
- Inconsistent with other reducers in the same file

### Why This Matters

The frontend uses types from `@melm-dash/shared-types`. When types evolve (e.g., adding `physicalCores` to `CpuMetrics`), the destructuring pattern automatically adapts, while manual enumeration requires code updates and can cause Docker build failures if forgotten.

### Type Structure Reference

```typescript
// From @melm-dash/shared-types
export interface CpuMetrics {
  usage: number;
  cores: number;
  physicalCores: number;  // Added later - auto-included with destructuring!
  model: string;
  speed: number;
}

export interface CpuPayload extends CpuMetrics {
  history: TimeSeriesPoint<number>[];
}
```

## MCP Server Integration

This project benefits from several Model Context Protocol (MCP) servers that enhance Claude's capabilities for development, testing, and analysis.

> **⚡ Performance Note**: For all code edits, prioritize using Morphllm's `edit_file` tool. It achieves 98% accuracy at 4,500 tokens/sec with 30-50% token savings compared to traditional methods. Use `warp-grep` first to surface relevant context across files before editing.

### Recommended MCP Servers

#### Context7 (`--c7`)
**Purpose**: Official documentation and framework patterns

**Use for**:
- React hooks, components, and best practices
- Fastify plugin development and route patterns
- Chakra UI component usage and theming
- Recharts chart configurations and customization
- TypeScript advanced patterns and generics
- Vitest testing patterns and mocking strategies

**Examples**:
```
"implement React useReducer with TypeScript" → Context7
"Fastify WebSocket plugin best practices" → Context7
"Chakra UI dark mode implementation" → Context7
"Recharts custom tooltip patterns" → Context7
```

#### Sequential Thinking (`--seq`)
**Purpose**: Multi-step reasoning for complex analysis and debugging

**Use for**:
- Debugging WebSocket connection issues across client/server
- Architecture reviews and refactoring planning
- Performance bottleneck identification
- Complex bug investigation spanning frontend/backend
- System design decisions and trade-off analysis

**Examples**:
```
"analyze why metrics aren't updating in real-time" → Sequential
"design architecture for GPU metrics collector" → Sequential
"debug memory leak in metrics store" → Sequential
"plan migration to different state management" → Sequential
```

#### Playwright (`--play`)
**Purpose**: Browser automation and E2E testing

**Use for**:
- Testing complete user workflows on the dashboard
- Visual regression testing of charts and layouts
- WebSocket connection testing from browser perspective
- Accessibility validation (WCAG compliance)
- Cross-browser compatibility verification
- Performance metrics (Core Web Vitals)

**Examples**:
```
"create E2E test for dashboard drag-and-drop layout" → Playwright
"test WebSocket reconnection with exponential backoff" → Playwright
"validate all panels are keyboard accessible" → Playwright
"measure dashboard load time performance" → Playwright
```

#### Serena (`--serena`)
**Purpose**: Semantic code operations and project memory

**Use for**:
- Renaming functions/types across all packages in monorepo
- Finding all references to shared types from `@melm-dash/shared-types`
- Navigating complex monorepo structure efficiently
- Refactoring with automatic dependency tracking
- Storing architectural decisions and patterns

**Examples**:
```
"rename MetricData type everywhere" → Serena
"find all usages of BroadcastManager" → Serena
"refactor WebSocket message handler structure" → Serena
"extract common panel logic into hook" → Serena
```

#### Memory (`--memory`)
**Purpose**: Track project context and decisions across sessions

**Use for**:
- Documenting why certain architectural decisions were made
- Tracking relationships between collectors, store, and scheduler
- Remembering configuration patterns and conventions
- Building cross-session project understanding
- Preserving historical context and rationale

**Examples**:
```
"remember: collectors run at 1s intervals, store keeps 60 points" → Memory
"track: scheduler → collectors → store → broadcast pattern" → Memory
"document: using Zod for config validation due to type safety" → Memory
```

#### Morphllm (`--morph`)
**Purpose**: Pattern-based semantic code editing engine with extreme speed and accuracy

> 📚 **Learn More**: [morphllm.com](https://morphllm.com) | [MCP Documentation](https://morph-555d6c14.mintlify.app/guides/mcp)

**Technical Details**:
- **Speed**: 4,500+ tokens/second processing
- **Accuracy**: 98%+ success rate (vs 86% for search-replace)
- **Performance**: ~6s per file edit vs ~35s with traditional methods
- **Method**: Uses semantic understanding with `// ... existing code ...` merge markers
- **Token Efficiency**: 30-50% reduction in token usage

**Use for**:
- Multi-file bulk transformations across the monorepo
- Framework migration updates (React class → hooks, Fastify patterns)
- Style guide enforcement and ESLint rule application
- Consistent pattern replacements across packages
- Large-scale refactoring with natural language instructions
- Token-efficient editing in resource-constrained scenarios

**When to Choose**:
- **Over Serena**: For pattern-based edits, not symbol operations
- **Over Manual Edit**: For 3+ files with similar changes
- **For Speed**: When editing large files or multiple files quickly
- **For Accuracy**: When search-replace would be fragile
- **Not for**: Symbol renames, dependency tracking, LSP semantic operations

**Examples**:
```
"update all React class components to functional components" → Morphllm
"replace all console.log with our logger utility" → Morphllm
"enforce TypeScript strict mode across all packages" → Morphllm
"update Fastify route handlers to use async/await" → Morphllm
"apply consistent error handling pattern to all collectors" → Morphllm
```

**How It Works**:
Morphllm uses AI models trained specifically on code edits. Instead of generating entire rewritten files, it intelligently merges your edit instructions into existing code using semantic understanding. The system recognizes code patterns and applies changes naturally, preserving formatting and context.

**Integration with Other Servers**:
- **Serena → Morphllm**: Serena analyzes semantic context → Morphllm executes precise edits
- **Sequential → Morphllm**: Sequential plans edit strategy → Morphllm applies systematic changes
- **Morphllm + Context7**: Apply framework patterns from Context7 across multiple files

### Common Workflow Patterns

#### Adding New Metric Collector
```
1. Sequential: Plan collector architecture and data structure
2. Context7: Check systeminformation library patterns
3. Serena: Navigate existing collector implementations
4. Implementation: Create collector + types + panel
5. Morphllm: Apply consistent error handling pattern to new collector
6. Playwright: Test metric display in browser
7. Memory: Document collector design decisions
```

#### Debugging WebSocket Issues
```
1. Sequential: Systematically analyze connection flow
2. Serena: Find all WebSocket-related code
3. Context7: Verify Fastify WebSocket plugin usage
4. Playwright: Test reconnection behavior in browser
5. Memory: Store solution for future reference
```

#### Refactoring Components
```
1. Serena: Analyze component dependencies and usage
2. Sequential: Plan refactoring strategy and impact
3. Serena: Execute renames and structural changes
4. Playwright: Verify UI behavior unchanged
5. Memory: Document refactoring patterns
```

#### UI Development
```
1. Context7: Get Chakra UI and Recharts best practices
2. Implementation: Build components with TypeScript
3. Playwright: Test interactions and accessibility
4. Context7: Optimize chart performance patterns
```

#### Bulk Code Transformation
```
1. Sequential: Plan transformation scope and strategy
2. Serena: Identify all files requiring changes
3. Morphllm: Apply pattern-based transformations across files
4. Validation: Run typecheck and tests
5. Memory: Document transformation rationale
```

### Auto-Activation Triggers

Based on keywords in your requests, servers auto-activate:

- **"debug", "analyze", "investigate", "why"** → Sequential
- **"React", "Chakra", "Fastify", "Recharts", "Vitest"** → Context7
- **"test E2E", "browser", "accessibility", "user flow"** → Playwright
- **"rename", "find references", "refactor", "extract"** → Serena
- **"remember", "track", "document decision"** → Memory
- **"update all", "replace everywhere", "enforce", "migrate", "bulk"** → Morphllm

### Server Combinations

**Complex Analysis**: Sequential + Context7 + Serena
```
"analyze the WebSocket message flow and suggest optimizations"
→ Sequential plans analysis, Serena navigates code, Context7 provides patterns
```

**Full Feature Implementation**: Context7 + Serena + Playwright + Memory
```
"add new system temperature metrics with real-time chart"
→ Context7 for patterns, Serena for navigation, Playwright for testing, Memory for decisions
```

**Monorepo Refactoring**: Serena + Sequential + Memory
```
"restructure shared types and update all imports"
→ Serena executes changes, Sequential validates impact, Memory documents approach
```

**Bulk Pattern Migration**: Sequential + Morphllm + Serena
```
"migrate all collectors to use new error handling pattern"
→ Sequential plans strategy, Serena identifies files, Morphllm applies transformations
```

**Style Enforcement**: Morphllm + Context7
```
"update all components to use Chakra UI v3 patterns"
→ Context7 provides v3 patterns, Morphllm applies across all files
```

### Performance Tips

- Use `--uc` (ultracompressed mode) for large-scale operations to save tokens
- **Use Morphllm for 3+ similar file edits** - 98% accuracy at 4,500 tokens/sec with 30-50% token savings
- Combine servers strategically rather than using all at once
- Prefer Serena over manual grep/find for monorepo navigation
- Use Memory to avoid re-analyzing architecture in every session
- Context7 results are cached - reuse queries when possible
- **Morphllm excels at monorepo-wide transformations** - ideal for this pnpm workspace structure

### Project-Specific Conventions

When working with this project, MCP servers should follow these patterns:

1. **Type Changes**: Use Serena to track usage across packages, then Morphllm for bulk updates
2. **Collector Development**: Use Sequential for planning, Context7 for systeminformation patterns
3. **Pattern Enforcement**: Use Morphllm for applying consistent patterns across all collectors/panels
4. **UI Components**: Context7 for Chakra/Recharts patterns, Morphllm for bulk style updates, Playwright for testing
5. **Architecture Decisions**: Document in Memory for team reference
6. **Bug Investigation**: Start with Sequential for systematic approach
7. **Framework Migrations**: Morphllm for transforming code patterns across the monorepo
8. **Code Style**: Use Morphllm to enforce ESLint/Prettier patterns consistently

## Docker Deployment

The app runs in Docker with access to host system metrics. Before deploying, check your Docker group GID:
```bash
getent group docker | cut -d: -f3
```
Update `group_add` in `docker-compose.yml` with this value.
