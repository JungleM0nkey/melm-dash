<img src="melmlogo.png" alt="melm-dash logo" width="200">

A real-time system monitoring dashboard for Linux systems. Features a modular, drag-and-drop interface where you can rearrange components to customize your layout. Displays CPU usage, memory consumption, network traffic, Docker container status, storage metrics, running services, open ports, and system information through a web interface.

![melm-dash screenshot](screenshot.jpeg)

## What It Does

- **Modular drag-and-drop interface** - Rearrange and customize component layout to your preferences
- Monitors system resources (CPU, memory, network, storage) in real-time
- Tracks Docker container status and resource usage
- Lists active systemd services and their states
- Shows open network ports and listening services
- Updates metrics via WebSocket connection every 2-10 seconds depending on metric type
- Serves a React-based web dashboard on port 3001

## Requirements

- Docker and Docker Compose
- Linux host system (requires access to `/proc`, `/sys`, and Docker socket)
- Node.js 18+ and pnpm 8+ (for local development only)

## Deployment with Docker Compose

### 1. Find Your Docker Group ID

The container needs access to the Docker socket. Find your host system's Docker group ID:

```bash
getent group docker | cut -d: -f3
```

### 2. Update docker-compose.yml

Edit the `group_add` section in [docker-compose.yml](docker-compose.yml:54) with your Docker group ID from step 1:

```yaml
group_add:
  - "109"  # Replace with your docker group GID
```

### 3. Build and Start

```bash
docker compose build
docker compose up -d
```

### 4. Access Dashboard

Open your browser to `http://localhost:3001`

The health endpoint is available at `http://localhost:3001/health`

## Local Development

### Native Development (without Docker)

#### Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: 8.0.0 or higher (required package manager)
- **Linux**: Requires access to `/proc`, `/sys` for system metrics
- **Docker socket** (optional): For Docker container monitoring

Verify your installation:
```bash
node --version   # Should show v18.x.x or higher
pnpm --version   # Should show 8.x.x or higher
```

#### Quick Start

```bash
# 1. Install all dependencies
pnpm install

# 2. Run development servers (backend + frontend with hot reload)
pnpm dev
```

Access points:
- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001/ws
- **Health Check**: http://localhost:3001/health

#### Environment Configuration (Optional)

Create a `.env` file in the project root to customize settings:

```bash
cp .env.example .env
```

Key environment variables:
| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `3001` | Backend server port |
| `LOG_LEVEL` | `info` | Logging level (trace/debug/info/warn/error) |
| `INTERVAL_CPU` | `2000` | CPU metrics interval (ms) |
| `INTERVAL_MEMORY` | `3000` | Memory metrics interval (ms) |
| `INTERVAL_DOCKER` | `5000` | Docker stats interval (ms) |
| `HISTORY_MAX_POINTS` | `300` | Data points kept in history |

#### Production Build

```bash
# Build all packages (shared-types → backend → frontend)
pnpm build

# Start production server
pnpm --filter @melm-dash/backend start
```

The production server serves both the API and the built frontend on port 3001.

#### Available Commands

```bash
pnpm dev          # Development mode with hot reload
pnpm build        # Build all packages for production
pnpm test         # Run all tests
pnpm lint         # Run linter
pnpm typecheck    # TypeScript type checking
pnpm clean        # Remove build artifacts
```

See [Native Development Guide](docs/NATIVE.md) for detailed documentation including troubleshooting, architecture overview, and advanced configuration.

### Docker Development (with hot reload)

For a containerized development environment with hot reload:

```bash
# Start development container
pnpm dev:docker

# Stop development container
pnpm dev:docker:down
```

- Frontend: http://localhost:5173 (Vite dev server with HMR)
- Backend API: http://localhost:3000 (Fastify with auto-restart)
- WebSocket: ws://localhost:3000/ws

See [Docker Development Guide](docs/DOCKER.md#development-with-docker) for details on the development setup, volume mounting, and troubleshooting.

## Build Process

The [Dockerfile](Dockerfile:1) uses a multi-stage build:

1. Installs dependencies with pnpm
2. Builds shared TypeScript types
3. Builds React frontend (Vite)
4. Builds Node.js backend (Fastify)
5. Creates production image with only runtime dependencies
6. Runs as non-root user `nodejs` (UID 1001)

## Configuration

Environment variables can be set in [docker-compose.yml](docker-compose.yml:18):

- `PORT`: Server port (default: 3001)
- `INTERVAL_CPU`: CPU collection interval in ms (default: 2000)
- `INTERVAL_MEMORY`: Memory collection interval in ms (default: 3000)
- `INTERVAL_NETWORK`: Network collection interval in ms (default: 2000)
- `INTERVAL_DOCKER`: Docker stats interval in ms (default: 5000)
- `INTERVAL_STORAGE`: Storage check interval in ms (default: 30000)
- `INTERVAL_SERVICES`: Service check interval in ms (default: 10000)
- `INTERVAL_PORTS`: Port scan interval in ms (default: 10000)
- `HISTORY_MAX_POINTS`: Maximum data points kept in memory (default: 300)



Backend uses [systeminformation](https://www.npmjs.com/package/systeminformation) library to collect system metrics. Frontend connects via WebSocket to receive real-time updates.

## Documentation

- [Native Development Guide](docs/NATIVE.md) - Running without Docker, prerequisites, configuration, and troubleshooting
- [Docker Build and Deployment Guide](docs/DOCKER.md) - Complete guide for building, configuring, and deploying with Docker

## License

MIT