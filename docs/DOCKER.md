# Docker Build and Deployment Guide

Complete guide for building, configuring, and deploying melm-dash using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Build Process](#build-process)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## Prerequisites

### Required

- **Docker**: Version 20.10+ recommended
- **Docker Compose**: Version 2.0+ (included with Docker Desktop)
- **Linux Host**: Required for system monitoring (access to `/proc`, `/sys`)

### Verify Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Verify Docker daemon is running
docker info
```

---

## Quick Start

### 1. Find Your Docker Group ID

The container needs Docker socket access to monitor containers. Get your host's Docker group ID:

```bash
getent group docker | cut -d: -f3
```

Example output: `109` (your value may differ)

### 2. Update Configuration

Edit `docker-compose.yml` line 55 with your Docker GID:

```yaml
group_add:
  - "109"  # Replace with your docker group GID
```

### 3. Build and Deploy

```bash
# Build the image
docker compose build

# Start in detached mode
docker compose up -d

# View logs
docker compose logs -f
```

### 4. Access Dashboard

- **Dashboard**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

---

## Build Process

### Multi-Stage Build Architecture

The Dockerfile uses a 7-stage build for optimal image size and security:

```
┌─────────────────────────────────────────────────────────────┐
│ Stage 1: base                                               │
│ - Node.js 22 Alpine                                         │
│ - pnpm 9.0.0 via corepack                                   │
│ - System utilities (iproute2, procps, dumb-init)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 2: deps                                               │
│ - Copy package.json files                                   │
│ - Install all dependencies (frozen lockfile)                │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Stage 3:        │ │ Stage 4:        │ │ Stage 5:        │
│ shared-types    │ │ frontend-build  │ │ backend-build   │
│ - TypeScript    │ │ - Vite build    │ │ - tsc compile   │
│   compilation   │ │ - React bundle  │ │ - Fastify app   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 6: prod-deps                                          │
│ - Production dependencies only (--prod)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 7: production                                         │
│ - Fresh Node.js 22 Alpine                                   │
│ - Copy only: prod deps + built artifacts                    │
│ - Non-root user (nodejs:1001)                               │
│ - ~150MB final image                                        │
└─────────────────────────────────────────────────────────────┘
```

### Build Commands

```bash
# Standard build
docker compose build

# Build with no cache (full rebuild)
docker compose build --no-cache

# Build with progress output
docker compose build --progress=plain

# Build specific stage (for debugging)
docker build --target deps -t melm-dash:deps .
docker build --target frontend-build -t melm-dash:frontend .
```

### Build Artifacts

| Source | Destination in Container |
|--------|--------------------------|
| `packages/shared-types/dist/` | `/app/packages/shared-types/dist/` |
| `backend/dist/` | `/app/backend/dist/` |
| `frontend/dist/` | `/app/backend/frontend-dist/` |

---

## Configuration

### Environment Variables

Configure via `docker-compose.yml` or `-e` flags:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `HOST` | Server bind address | `0.0.0.0` |
| `PORT` | Server port | `3001` |
| `LOG_LEVEL` | Logging verbosity (`debug`, `info`, `warn`, `error`) | `info` |

#### Collection Intervals (milliseconds)

| Variable | Description | Default |
|----------|-------------|---------|
| `INTERVAL_CPU` | CPU metrics polling | `2000` |
| `INTERVAL_MEMORY` | Memory metrics polling | `3000` |
| `INTERVAL_NETWORK` | Network metrics polling | `2000` |
| `INTERVAL_DOCKER` | Docker stats polling | `5000` |
| `INTERVAL_STORAGE` | Storage metrics polling | `30000` |
| `INTERVAL_SERVICES` | Systemd services polling | `10000` |
| `INTERVAL_PORTS` | Open ports scanning | `10000` |
| `INTERVAL_SYSTEM` | System info polling | `60000` |

#### Data Retention

| Variable | Description | Default |
|----------|-------------|---------|
| `HISTORY_MAX_POINTS` | Historical data points kept | `300` |
| `WS_MAX_PAYLOAD` | Max WebSocket message size (bytes) | `1048576` |


---

## Deployment

### Standard Deployment

```bash
# Start services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f melm-dash

# Stop services
docker compose down
```

### Manual Docker Run

If not using Docker Compose:

```bash
# Build image
docker build -t melm-dash:latest .

# Get Docker GID
DOCKER_GID=$(getent group docker | cut -d: -f3)

# Run container
docker run -d \
  --name melm-dash \
  --restart unless-stopped \
  -p 3001:3001 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  --group-add ${DOCKER_GID} \
  --cap-add SYS_PTRACE \
  --security-opt no-new-privileges:true \
  melm-dash:latest
```

### Health Checks

The container includes a health check that polls `/health` every 30 seconds:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' melm-dash

# View health check history
docker inspect --format='{{json .State.Health}}' melm-dash | jq
```

Health check parameters:
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Start Period**: 15 seconds
- **Retries**: 3

### Updating

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose build
docker compose up -d

# Or one command
docker compose up -d --build
```

---

## Security

### Security Features

1. **Non-root User**: Runs as `nodejs` (UID 1001)
2. **No New Privileges**: `security_opt: no-new-privileges:true`
3. **Read-only Mounts**: System paths mounted as read-only
4. **Minimal Image**: Alpine-based, production dependencies only
5. **Process Manager**: dumb-init prevents zombie processes

### Required Permissions

| Mount/Capability | Purpose |
|------------------|---------|
| `/var/run/docker.sock:ro` | Docker container monitoring |
| `/proc:/host/proc:ro` | CPU, memory, process metrics |
| `/sys:/host/sys:ro` | Hardware information |
| `SYS_PTRACE` capability | Process inspection |
| `group_add: docker` | Docker socket access |

### Resource Limits

Default limits in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 128M
```

Adjust based on monitored system size:
- Small (< 10 containers): 256M memory
- Medium (10-50 containers): 512M memory
- Large (> 50 containers): 1G memory

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker compose logs melm-dash
```

**Common issues:**

1. **Port already in use:**
   ```bash
   # Find process using port 3001
   sudo lsof -i :3001
   # Or change port in docker-compose.yml
   ports:
     - "3002:3001"
   ```

2. **Docker socket permission denied:**
   ```bash
   # Verify Docker GID
   getent group docker | cut -d: -f3
   # Update docker-compose.yml group_add with correct GID
   ```

### No Docker Metrics

**Symptoms:** Dashboard shows no Docker containers

**Solutions:**

1. Verify Docker socket mount:
   ```bash
   docker exec melm-dash ls -la /var/run/docker.sock
   ```

2. Check group membership:
   ```bash
   docker exec melm-dash id
   # Should show docker group in groups list
   ```

3. Test Docker access inside container:
   ```bash
   docker exec melm-dash wget -qO- --unix-socket /var/run/docker.sock http://localhost/containers/json
   ```

### High Memory Usage

**Reduce history retention:**
```yaml
environment:
  - HISTORY_MAX_POINTS=100  # Reduce from 300
```

**Increase collection intervals:**
```yaml
environment:
  - INTERVAL_CPU=5000      # 5s instead of 2s
  - INTERVAL_MEMORY=5000
```

### WebSocket Connection Issues

**Check from host:**
```bash
# Test WebSocket endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:3001/ws
```

**Check container network:**
```bash
docker exec melm-dash wget -qO- http://localhost:3001/health
```

---

## Advanced Usage

### Custom Network

```yaml
services:
  melm-dash:
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name monitor.example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

### Multiple Instances

Monitor multiple hosts by running separate containers:

```yaml
services:
  melm-dash-host1:
    image: melm-dash:latest
    ports:
      - "3001:3001"
    # ... config for host1

  melm-dash-host2:
    image: melm-dash:latest
    ports:
      - "3002:3001"
    # ... config for host2
```

### Building for Different Architectures

```bash
# Build for ARM64 (e.g., Raspberry Pi, Apple Silicon)
docker buildx build --platform linux/arm64 -t melm-dash:arm64 .

# Build multi-arch image
docker buildx build --platform linux/amd64,linux/arm64 -t melm-dash:latest .
```

### Development with Docker

Full development environment with hot reload and separate dev/prod configurations.

#### Quick Start

```bash
# Start development environment
pnpm dev:docker

# Or manually with Docker Compose
docker compose -f docker-compose.dev.yml up --build

# Stop development environment
pnpm dev:docker:down
```

#### Architecture

Development setup differs from production:

| Aspect | Development | Production |
|--------|-------------|------------|
| **Ports** | Backend: 3000, Frontend: 5173 | Backend: 3001 |
| **Build** | No build, live dev servers | Multi-stage optimized build |
| **Dependencies** | All (including devDependencies) | Production only |
| **Hot Reload** | ✅ Full hot reload (HMR) | ❌ Static files |
| **Source Code** | Mounted as volumes | Copied during build |
| **node_modules** | Named volumes (container) | Copied during build |

#### Development Setup Details

**Dockerfile.dev:**
- Base: Node.js 22 Alpine
- Installs: pnpm + system utilities
- Includes: ALL dependencies (dev + prod)
- Command: `pnpm dev` (runs parallel dev servers)

**docker-compose.dev.yml:**
- **Source Mounts**: Backend, frontend, packages directories mounted for instant code updates
- **node_modules Isolation**: Uses named volumes to prevent host/container conflicts
- **Environment**: NODE_ENV=development, faster polling intervals
- **Ports Exposed**:
  - `3000` → Backend Fastify server with hot reload
  - `5173` → Frontend Vite dev server with HMR

**Hot Reload Mechanism:**
- **Backend**: `tsx watch` automatically restarts on file changes
- **Frontend**: Vite HMR instantly updates browser on save
- **Types**: Changes in `shared-types` trigger rebuilds in both

#### Configuration

Before starting, verify your Docker group ID:

```bash
getent group docker | cut -d: -f3
```

Update `docker-compose.dev.yml` line 73 if your GID differs from 109.

#### Access Points

- **Frontend Dev Server**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **WebSocket**: ws://localhost:3000/ws

#### Development Workflow

```bash
# 1. Start development environment
pnpm dev:docker

# 2. Make code changes in your editor
# Changes are automatically detected and reload

# 3. View logs (in another terminal)
docker compose -f docker-compose.dev.yml logs -f

# 4. Stop environment when done
pnpm dev:docker:down
```

#### Volume Strategy

**Bind Mounts** (source code):
```yaml
- ./backend:/app/backend       # Backend hot reload
- ./frontend:/app/frontend     # Frontend hot reload
- ./packages:/app/packages     # Shared types hot reload
```

**Named Volumes** (dependencies):
```yaml
- node_modules:/app/node_modules                           # Root
- backend_node_modules:/app/backend/node_modules          # Backend
- frontend_node_modules:/app/frontend/node_modules        # Frontend
- shared_types_node_modules:/app/packages/shared-types/node_modules
```

**Why separate volumes?**
- Prevents host/container architecture conflicts (e.g., macOS vs Linux binaries)
- Ensures native modules like `systeminformation` work correctly
- Faster performance (no cross-mount overhead)

#### Troubleshooting Development

**Hot reload not working:**
```bash
# Verify volumes are mounted
docker exec melm-dash-dev ls -la /app/backend/src

# Check file watching limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**Port conflicts:**
```bash
# Check what's using ports 3000 or 5173
sudo lsof -i :3000
sudo lsof -i :5173

# Or change ports in docker-compose.dev.yml
ports:
  - "3002:3000"  # Backend on host port 3002
  - "5174:5173"  # Frontend on host port 5174
```

**Module not found errors:**
```bash
# Rebuild with clean volumes
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

**Slow performance:**
```bash
# Use Docker Desktop settings to allocate more resources
# Recommended: 4 CPU cores, 8GB RAM for development

# Or optimize file watching
# Add to docker-compose.dev.yml environment:
- CHOKIDAR_USEPOLLING=false  # Disable polling (faster)
```

---

## Reference

### Container Layout

```
/app/
├── node_modules/           # Root dependencies
├── backend/
│   ├── dist/              # Compiled backend
│   ├── frontend-dist/     # Built frontend (served statically)
│   ├── node_modules/      # Backend dependencies
│   └── package.json
├── packages/
│   └── shared-types/
│       ├── dist/          # Compiled types
│       └── package.json
├── package.json
└── pnpm-workspace.yaml
```

### Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| 3001 | HTTP | Web dashboard |
| 3001 | WebSocket | Real-time metrics (`/ws`) |

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Dashboard UI |
| `/health` | GET | Health check |
| `/ws` | WebSocket | Metrics stream |
