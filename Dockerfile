#############################################
# 1. BASE (Debian) – install dependencies
#############################################
FROM node:20-bullseye AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace package files and install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

#############################################
# 2. BUILDER (Debian) – build backend + frontend
#############################################
FROM base AS builder
ARG NODE_ENV=production
ARG DATABASE_PROVIDER=postgresql

ENV NODE_ENV=${NODE_ENV}
ENV DATABASE_PROVIDER=${DATABASE_PROVIDER}
ENV DOCKER_CONTEXT=true
ENV PRISMA_SCHEMA_DIR=/app/api/prisma

# Copy all source code
COPY . .

# Copy Prisma schema selector script
COPY scripts/select-prisma-schema.sh /tmp/select-prisma-schema.sh
RUN chmod +x /tmp/select-prisma-schema.sh

# Generate Prisma Client for backend
RUN DATABASE_PROVIDER=${DATABASE_PROVIDER:-sqlite} /tmp/select-prisma-schema.sh generate

# Build backend
RUN pnpm run build:api

# Generate Prisma Client for TypeScript build
WORKDIR /app/api
RUN npx prisma generate --schema prisma/schema.prisma

# Build frontend (Next.js)
RUN pnpm run build

#############################################
# 3. PRODUCTION IMAGE (Alpine)
#############################################
FROM node:20-alpine AS production

# Install required system libraries
RUN apk add --no-cache \
    curl \
    bash \
    postgresql-client \
    openssl \
    ncurses

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Create directories
RUN mkdir -p /app/frontend /app/backend /app/backups /app/logs /app/data

#############################################
# Copy build artifacts
#############################################
# Frontend
COPY --from=builder /app/.next /app/frontend/.next
COPY --from=builder /app/public /app/frontend/public
COPY --from=builder /app/package.json /app/frontend/package.json

# Backend
COPY --from=builder /app/api/dist /app/backend/dist
COPY --from=builder /app/api/prisma /app/backend/prisma
COPY --from=builder /app/api/package.backend.json /app/backend/package.json

# Scripts and env
COPY --from=builder /app/docker-entrypoint.sh /app/docker-entrypoint.sh
COPY --from=builder /app/.env.example /app/.env.example
RUN chmod +x /app/docker-entrypoint.sh

#############################################
# Install production dependencies
#############################################
# Backend only (avec Prisma)
WORKDIR /app/backend
RUN pnpm install --prod
# Regenerate Prisma Client to ensure .prisma/client exists
RUN npx prisma generate --schema prisma/schema.prisma
RUN chown -R node:node /app/backend

# Frontend dependencies (prod only, no Prisma)
WORKDIR /app/frontend
RUN pnpm install --prod --ignore-scripts
RUN chown -R node:node /app/frontend

#############################################
# Default environment variables
#############################################
ENV NODE_ENV=production
ENV DATABASE_PROVIDER=postgresql
ENV DATABASE_URL=""
ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKUP_ENABLED=true
ENV AUTO_BACKUP_BEFORE_MIGRATION=true
ENV DISABLE_DB_RESET=true
ENV DISABLE_SEED_OVERRIDE=true
ENV REQUIRE_MIGRATION_BACKUP=true
ENV LOG_LEVEL=warn
ENV LOG_FILE=logs/api.log
ENV BACKEND_PORT=8080
ENV FRONTEND_PORT=3000
ENV POSTGRES_HOST=postgres
ENV POSTGRES_PORT=5432
ENV POSTGRES_DB=aether_identity
ENV POSTGRES_USER=aether_user

# Expose ports
EXPOSE 3000 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${BACKEND_PORT:-8080}/health || exit 1

# Use unprivileged user
USER node

# Entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]