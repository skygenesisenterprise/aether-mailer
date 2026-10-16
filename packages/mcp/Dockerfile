# Build from the repository root (the root pnpm-workspace.yaml is the single
# workspace for the whole monorepo):
#   docker build -f packages/mcp/Dockerfile .

# ----- Build Stage -----
FROM node:lts-alpine AS builder
WORKDIR /usr/src/app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Copy the workspace definition + lockfile and the package sources
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/mcp ./packages/mcp

# Install dependencies and build
RUN pnpm install --filter=@notploy/mcp... --frozen-lockfile
RUN pnpm --filter=@notploy/mcp run build

# ----- Production Stage -----
FROM node:lts-alpine
WORKDIR /usr/src/app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Copy workspace definition + lockfile and the package manifest for production install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/mcp/package.json ./packages/mcp/

# Install only production dependencies
RUN pnpm install --filter=@notploy/mcp --prod --frozen-lockfile --ignore-scripts

# Copy built artifacts
COPY --from=builder /usr/src/app/packages/mcp/build ./packages/mcp/build

WORKDIR /usr/src/app/packages/mcp

# Expose port 3000 (internal container port)
EXPOSE 3000

# Add health check for HTTP mode
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD if [ "$MCP_TRANSPORT" = "http" ] || [ "$MCP_TRANSPORT" = "sse" ]; then \
        wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1; \
      else \
        exit 0; \
      fi

# Default command supports both stdio and HTTP modes
CMD ["node", "build/index.js"]
