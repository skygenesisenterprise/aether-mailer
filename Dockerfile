# Multi-stage build for Aether Mailer - All-in-One Container
# Architecture: Next.js (3000) + Go Backend (8080) + PostgreSQL (5432) + Redis (6379)

# Stage 1: Build Go server
FROM golang:1.23-alpine AS server-builder
WORKDIR /server

# Install git (required for some Go modules)
RUN apk add --no-cache git

# Copy Go mod files
COPY server/go.mod server/go.sum ./
RUN go mod download

# Copy server source code
COPY server/ ./

# Build the Go server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Stage 2: Build Next.js frontend
FROM node:20-alpine AS frontend-builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy app configuration and source
COPY app/package.json ./app/package.json
COPY app/tsconfig.json app/next.config.ts app/tailwind.config.js app/postcss.config.mjs ./app/
COPY app/components.json app/eslint.config.mjs ./app/
COPY app/ ./app/

# Copy CLI configuration and source
COPY cli/package.json ./cli/package.json
COPY cli/tsconfig.json cli/tsconfig.build.json ./cli/
COPY cli/ ./cli/

# Install dependencies in workspace mode
RUN pnpm install --no-frozen-lockfile

# Build application
RUN cd app && pnpm build

# Build CLI
RUN cd cli && pnpm build

# Stage 3: Production image with all services
FROM alpine:latest AS production

# Install runtime dependencies
RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    postgresql \
    postgresql-contrib \
    curl \
    su-exec \
    nodejs \
    npm \
    build-base

# Create application user
RUN addgroup --system --gid 1001 mailer && \
    adduser --system --uid 1001 --ingroup mailer mailer

# Create directories BEFORE copying files
RUN mkdir -p /var/lib/postgresql/data /var/run/postgresql /var/log/postgresql && \
    chown -R mailer:mailer /var/lib/postgresql /var/run/postgresql /var/log/postgresql

WORKDIR /app

# Copy built applications
COPY --from=server-builder --chown=mailer:mailer /server/main ./server/
COPY --from=frontend-builder --chown=mailer:mailer /app/app/.next/standalone ./
COPY --from=frontend-builder --chown=mailer:mailer /app/app/.next/static ./.next/static
COPY --from=frontend-builder --chown=mailer:mailer /app/cli/dist ./cli/

# Copy configurations
COPY --chown=mailer:mailer prisma/ ./prisma/
COPY --chown=mailer:mailer docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Install Prisma CLI globally
RUN npm install -g prisma

# Create symlink for CLI binary
RUN ln -sf /app/cli/main.js /usr/local/bin/mailer && \
    chmod +x /usr/local/bin/mailer

# Switch to application user
USER mailer

# Expose only public port (Next.js)
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV GO_ENV=production
ENV DATABASE_PROVIDER=postgresql
ENV POSTGRES_DB=aether_mailer
ENV POSTGRES_USER=mailer
ENV POSTGRES_PASSWORD=mailer_postgres

# Start all services
CMD ["./docker-entrypoint.sh"]