# Native Development Guide

This guide covers running melm-dash without Docker, directly on your Linux system.

## Prerequisites

### System Requirements

| Requirement | Minimum Version | Notes |
|-------------|-----------------|-------|
| Node.js | 18.0.0+ | LTS version recommended |
| pnpm | 8.0.0+ | Required package manager |
| Operating System | Linux | Requires `/proc` and `/sys` access |
| Docker (optional) | Any | Only needed for Docker container monitoring |

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check pnpm version
pnpm --version
# Expected: 8.x.x or higher

# Install pnpm if not available
npm install -g pnpm
```

### System Access Requirements

For full functionality, the application needs access to:

| Resource | Purpose | Required |
|----------|---------|----------|
| `/proc` | CPU, memory, process information | Yes |
| `/sys` | Hardware info, system state | Yes |
| `/var/run/docker.sock` | Docker container monitoring | No |
| systemd | Service status monitoring | No |
| Network interfaces | Network traffic metrics | Yes |

All of these are typically available to regular users on a standard Linux system.

## Project Structure

```
melm-dash/
├── package.json              # Root workspace configuration
├── pnpm-workspace.yaml       # pnpm workspace definition
├── .env.example              # Environment variable template
│
├── packages/
│   └── shared-types/         # TypeScript types (builds first)
│       ├── package.json
│       ├── src/
│       └── dist/             # Built output
│
├── backend/                  # Fastify server
│   ├── package.json
│   ├── src/
│   │   ├── index.ts          # Entry point
│   │   ├── config.ts         # Configuration
│   │   ├── collectors/       # Metric collectors
│   │   ├── services/         # Scheduler, broadcast, metrics store
│   │   └── routes/           # API and WebSocket routes
│   └── dist/                 # Built output
│
└── frontend/                 # React application
    ├── package.json
    ├── vite.config.ts        # Vite configuration
    ├── src/
    │   ├── main.tsx          # React entry point
    │   ├── App.tsx           # Main component
    │   ├── context/          # State management
    │   ├── components/       # React components
    │   └── services/         # WebSocket client
    └── dist/                 # Built output
```

## Installation

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd melm-dash

# Install all workspace dependencies
pnpm install
```

This installs dependencies for all packages:
- Root dependencies
- `@melm-dash/shared-types`
- `@melm-dash/backend`
- `@melm-dash/frontend`

### 2. Environment Configuration (Optional)

Create environment files for customization:

```bash
# Backend/root configuration
cp .env.example .env

# Frontend configuration (optional)
cp frontend/.env.example frontend/.env
```

## Running the Application

### Development Mode (Recommended)

Run both backend and frontend with hot reload:

```bash
pnpm dev
```

This starts:
- **Backend**: `tsx watch` on port 3001 (auto-restarts on changes)
- **Frontend**: Vite dev server on port 5173 (instant HMR)

Access points:
| Service | URL |
|---------|-----|
| Frontend Dashboard | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| WebSocket | ws://localhost:3001/ws |
| Health Check | http://localhost:3001/health |

### Running Components Separately

```bash
# Terminal 1: Backend only
pnpm --filter @melm-dash/backend dev

# Terminal 2: Frontend only
pnpm --filter @melm-dash/frontend dev
```

### Production Mode

Build and run for production:

```bash
# Build all packages (handles correct order automatically)
pnpm build

# Start production server
pnpm --filter @melm-dash/backend start

# Or with environment variables
PORT=8080 NODE_ENV=production pnpm --filter @melm-dash/backend start
```

In production mode, the backend serves both the API and the built frontend static files on the same port.

## Environment Variables

### Backend Configuration

All variables have sensible defaults and are optional:

| Variable | Type | Default | Range | Description |
|----------|------|---------|-------|-------------|
| `HOST` | string | `0.0.0.0` | - | Server bind address |
| `PORT` | number | `3001` | 1-65535 | Server port |
| `NODE_ENV` | enum | `development` | development/production/test | Environment mode |
| `LOG_LEVEL` | enum | `info` | trace/debug/info/warn/error/fatal | Logging verbosity |

#### Collection Intervals (milliseconds)

| Variable | Default | Minimum | Description |
|----------|---------|---------|-------------|
| `INTERVAL_CPU` | `2000` | 500 | CPU metrics collection |
| `INTERVAL_MEMORY` | `3000` | 500 | Memory metrics collection |
| `INTERVAL_NETWORK` | `2000` | 500 | Network traffic metrics |
| `INTERVAL_DOCKER` | `5000` | 1000 | Docker container stats |
| `INTERVAL_STORAGE` | `30000` | 5000 | Storage/disk metrics |
| `INTERVAL_SERVICES` | `10000` | 1000 | systemd service status |
| `INTERVAL_PORTS` | `10000` | 1000 | Open ports scan |
| `INTERVAL_SYSTEM` | `60000` | 10000 | System information |

#### History and WebSocket

| Variable | Default | Range | Description |
|----------|---------|-------|-------------|
| `HISTORY_MAX_POINTS` | `300` | 10-10000 | Data points kept in memory |
| `WS_MAX_PAYLOAD` | `1048576` | 1024+ | Max WebSocket message size (bytes) |

### Frontend Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_WS_PORT` | `3001` | WebSocket server port |

## Available Commands

### Root Level (All Packages)

```bash
pnpm dev          # Run development servers
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking
pnpm clean        # Remove build artifacts
```

### Backend Specific

```bash
pnpm --filter @melm-dash/backend dev           # Development with hot reload
pnpm --filter @melm-dash/backend build         # Compile TypeScript
pnpm --filter @melm-dash/backend start         # Run production build
pnpm --filter @melm-dash/backend test          # Run tests
pnpm --filter @melm-dash/backend test:watch    # Tests in watch mode
pnpm --filter @melm-dash/backend test:coverage # Tests with coverage
pnpm --filter @melm-dash/backend clean         # Remove dist/
pnpm --filter @melm-dash/backend typecheck     # Type check only
```

### Frontend Specific

```bash
pnpm --filter @melm-dash/frontend dev           # Vite dev server
pnpm --filter @melm-dash/frontend build         # Vite production build
pnpm --filter @melm-dash/frontend preview       # Preview production build
pnpm --filter @melm-dash/frontend lint          # ESLint
pnpm --filter @melm-dash/frontend test          # Run tests
pnpm --filter @melm-dash/frontend test:watch    # Tests in watch mode
pnpm --filter @melm-dash/frontend test:coverage # Tests with coverage
```

## Build Order

The monorepo has build dependencies:

```
@melm-dash/shared-types  →  @melm-dash/backend
                         →  @melm-dash/frontend
```

`shared-types` must build first as both backend and frontend depend on it. The root `pnpm build` handles this automatically.

## Testing

### Run All Tests

```bash
pnpm test
```

### Package-Specific Tests

```bash
# Backend tests
pnpm --filter @melm-dash/backend test
pnpm --filter @melm-dash/backend test:watch
pnpm --filter @melm-dash/backend test:coverage

# Frontend tests
pnpm --filter @melm-dash/frontend test
pnpm --filter @melm-dash/frontend test:watch
pnpm --filter @melm-dash/frontend test:coverage
```

### Test Configuration

- **Backend**: Node environment, Vitest, tests in `*.test.ts` files
- **Frontend**: jsdom environment, Vitest + React Testing Library

## Architecture Overview

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Scheduler  │────▶│  Collectors │────▶│ MetricsStore │
└─────────────┘     └─────────────┘     └──────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser   │◀────│  WebSocket  │◀────│  Broadcast   │
│  Dashboard  │     │   Client    │     │   Manager    │
└─────────────┘     └─────────────┘     └──────────────┘
```

1. **Scheduler** triggers metric collectors at configured intervals
2. **Collectors** fetch data using `systeminformation` library
3. **MetricsStore** updates in-memory state and history
4. **BroadcastManager** sends WebSocket messages to connected clients
5. **Frontend DashboardContext** receives and dispatches updates
6. **React Components** re-render with new data

### Key Technologies

| Component | Technology |
|-----------|------------|
| Backend Framework | Fastify 5 |
| WebSocket | @fastify/websocket |
| System Metrics | systeminformation |
| Frontend Framework | React 18 |
| UI Components | Chakra UI |
| Charts | Recharts |
| Layout | react-grid-layout |
| Build Tool | Vite |
| Type Safety | TypeScript |
| Testing | Vitest |

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :3001
sudo lsof -i :5173

# Kill process by PID
kill -9 <PID>
```

### Dependencies Issues

```bash
# Clean and reinstall
rm -rf node_modules
rm -rf packages/shared-types/node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules
pnpm install
```

### Build Failures

```bash
# Clean all build artifacts
pnpm clean

# Rebuild from scratch
pnpm build
```

### WebSocket Connection Issues

1. Verify backend is running: `curl http://localhost:3001/health`
2. Check firewall allows port 3001
3. Ensure frontend's `VITE_WS_PORT` matches backend port
4. Check browser console for connection errors

### Docker Metrics Not Available

If Docker container monitoring shows no data:

1. Verify Docker is running: `docker ps`
2. Check socket access: `ls -la /var/run/docker.sock`
3. Ensure your user is in the docker group: `groups`

### High Memory Usage

Reduce memory footprint by adjusting:

```env
# Reduce history retention
HISTORY_MAX_POINTS=100

# Increase collection intervals (less frequent updates)
INTERVAL_CPU=5000
INTERVAL_MEMORY=10000
```

### Permission Errors

If you see permission errors for system metrics:

```bash
# Check /proc access
ls /proc/stat

# Check /sys access
ls /sys/class/net
```

Most Linux distributions allow regular user access to these paths. If not, you may need to run as root (not recommended for production).

## Performance Tuning

### For Low-Resource Systems

```env
# Reduce update frequency
INTERVAL_CPU=5000
INTERVAL_MEMORY=10000
INTERVAL_NETWORK=5000
INTERVAL_DOCKER=15000
INTERVAL_STORAGE=60000
INTERVAL_SERVICES=30000
INTERVAL_PORTS=30000

# Reduce history retention
HISTORY_MAX_POINTS=100
```

### For High-Frequency Monitoring

```env
# Increase update frequency (more CPU usage)
INTERVAL_CPU=1000
INTERVAL_MEMORY=1000
INTERVAL_NETWORK=1000

# Increase history for longer trends
HISTORY_MAX_POINTS=600
```

## Running as a Service

### Using systemd

Create `/etc/systemd/system/melm-dash.service`:

```ini
[Unit]
Description=melm-dash System Monitor
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/melm-dash
ExecStart=/usr/bin/pnpm --filter @melm-dash/backend start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable melm-dash
sudo systemctl start melm-dash
sudo systemctl status melm-dash
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
cd /path/to/melm-dash
pm2 start "pnpm --filter @melm-dash/backend start" --name melm-dash

# Enable startup
pm2 startup
pm2 save
```

## Next Steps

- Configure environment variables for your needs
- Set up as a system service for persistence
- Configure a reverse proxy (nginx/caddy) for production
- Enable HTTPS via reverse proxy

For Docker deployment, see [Docker Guide](DOCKER.md).
