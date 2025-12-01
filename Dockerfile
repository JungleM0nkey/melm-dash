# =============================================================================
# Stage 1: Base - pnpm and system utilities
# =============================================================================
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN apk add --no-cache iproute2 procps dumb-init wget

WORKDIR /app

# =============================================================================
# Stage 2: Dependencies
# =============================================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 3: Build shared-types
# =============================================================================
FROM deps AS shared-types-build

COPY packages/shared-types/ ./packages/shared-types/
RUN pnpm --filter @melm-dash/shared-types build

# =============================================================================
# Stage 4: Build frontend
# =============================================================================
FROM deps AS frontend-build

COPY --from=shared-types-build /app/packages/shared-types/dist ./packages/shared-types/dist
COPY packages/shared-types/package.json ./packages/shared-types/
COPY frontend/ ./frontend/

RUN pnpm --filter @melm-dash/frontend build

# =============================================================================
# Stage 5: Build backend
# =============================================================================
FROM deps AS backend-build

COPY --from=shared-types-build /app/packages/shared-types/dist ./packages/shared-types/dist
COPY packages/shared-types/package.json ./packages/shared-types/
COPY backend/ ./backend/

RUN pnpm --filter @melm-dash/backend build

# =============================================================================
# Stage 6: Production dependencies only
# =============================================================================
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN pnpm install --frozen-lockfile --prod

# =============================================================================
# Stage 7: Production runtime
# =============================================================================
FROM node:22-alpine AS production

RUN apk add --no-cache iproute2 procps dumb-init

WORKDIR /app

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/backend/node_modules ./backend/node_modules
# Note: shared-types has no runtime dependencies (only devDependencies for TypeScript)

# Copy built artifacts
COPY --from=shared-types-build /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=frontend-build /app/frontend/dist ./backend/frontend-dist

# Copy package files for workspace resolution
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Create non-root user for security
# Note: Docker socket access is handled via docker-compose group_add
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Environment
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:3001/health || exit 1

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/dist/index.js"]
