# Multi-stage build for Aether Mailer - Linux Distro Container
# Architecture: Next.js (3000) + Go Backend (8080) + PostgreSQL (5432) + SSH Management (2222)
# FHS-compliant filesystem structure for container compatibility

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
    build-base \
    openssh \
    openssh-server \
    shadow \
    sudo \
    caddy \
    supervisor \
    openssl \
    linux-pam \
    net-tools \
    procps \
    findutils

# Create application user
RUN addgroup --system --gid 1001 mailer && \
    adduser --system --uid 1001 --ingroup mailer mailer

# Create SSH user with proper shell path
RUN addgroup --system --gid 1002 ssh-users && \
    adduser --system --uid 1002 --ingroup ssh-users --shell /usr/bin/mailer-shell.sh ssh-user && \
    echo "ssh-user:tempPassword123" | chpasswd

# Create directories BEFORE copying files
RUN mkdir -p /var/lib/postgresql/data /var/run/postgresql /var/log/postgresql && \
    chown -R mailer:mailer /var/lib/postgresql /var/run/postgresql /var/log/postgresql

WORKDIR /app

# Copy built applications
COPY --from=server-builder --chown=mailer:mailer /server/main ./server/
COPY --from=frontend-builder --chown=mailer:mailer /app/app/.next/standalone ./
COPY --from=frontend-builder --chown=mailer:mailer /app/app/.next/static ./.next/static
COPY --from=frontend-builder --chown=mailer:mailer /app/cli/dist ./cli/

# Copy Linux distro filesystem structure
COPY --chown=root:root docker/rootfs/ /

# Copy configurations
COPY --chown=mailer:mailer prisma/ ./prisma/
COPY --chown=mailer:mailer docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Install Prisma CLI globally and setup binaries
RUN npm install -g prisma && \
    ln -sf /app/cli/main.js /usr/local/bin/mailer && \
    chmod +x /usr/local/bin/mailer

# Initialize container environment
RUN /usr/bin/container-init.sh

# Switch to application user
USER mailer

# Expose public ports
EXPOSE 3000 2222

# Environment variables (secrets should be provided at runtime)
ARG POSTGRES_PASSWORD_ARG=mailer_postgres
ARG SSH_AUTH_SERVICE_URL_ARG=""
ARG SSH_ENABLE_LOCAL_AUTH_ARG=true

ENV NODE_ENV=production
ENV GO_ENV=production
ENV DATABASE_PROVIDER=postgresql
ENV POSTGRES_DB=aether_mailer
ENV POSTGRES_USER=mailer
ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD_ARG}
ENV SSH_PORT=2222
ENV SSH_USER=ssh-user
ENV SSH_AUTH_SERVICE_URL=${SSH_AUTH_SERVICE_URL_ARG}
ENV SSH_ENABLE_LOCAL_AUTH=${SSH_ENABLE_LOCAL_AUTH_ARG}
ENV SSH_AUTH_SERVICE_URL=""
ENV SSH_ENABLE_LOCAL_AUTH="true"

# Start all services
CMD ["./docker-entrypoint.sh"]