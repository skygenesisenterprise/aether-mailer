# Aether Mailer Dockerfile with Linux Distro-like Structure
# Multi-stage build with FHS-compliant filesystem

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

# Stage 3: Production image with Linux distro structure
FROM alpine:latest AS production

# Labels for container metadata
LABEL maintainer="Sky Genesis Enterprise <devops@skygenesisenterprise.com>"
LABEL description="Aether Mailer - Modern Mail Server with CLI Management"
LABEL version="0.1.0"
LABEL org.opencontainers.image.source="https://github.com/skygenesisenterprise/aether-mailer"

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
    linux-pam \
    net-tools \
    procps \
    findutils

# Create application and SSH users with specific UIDs/GIDs
RUN addgroup --system --gid 1001 mailer && \
    adduser --system --uid 1001 --ingroup mailer mailer && \
    addgroup --system --gid 1002 ssh-users && \
    adduser --system --uid 1002 --ingroup ssh-users --shell /usr/bin/mailer-shell.sh ssh-user && \
    echo "ssh-user:$(openssl rand -base64 32)" | chpasswd

# Create essential directories following FHS
RUN mkdir -p /var/lib/postgresql/data /var/run/postgresql /var/log/postgresql && \
    mkdir -p /var/run/sshd /var/log/sshd /var/log/mailer && \
    mkdir -p /tmp/aether-mailer /opt/aether-mailer /usr/local/bin && \
    chown -R mailer:mailer /var/lib/postgresql /var/run/postgresql /var/log/postgresql && \
    chown -R root:root /var/run/sshd /var/log/sshd /var/log/mailer

# Copy the entire Linux distro filesystem
COPY --chown=root:root docker/rootfs/ /

# Copy built applications
COPY --from=server-builder --chown=mailer:mailer /server/main /opt/aether-mailer/bin/
COPY --from=frontend-builder --chown=mailer:mailer /app/app/.next/standalone /opt/aether-mailer/app/
COPY --from=frontend-builder --chown=mailer:mailer /app/app/.next/static /opt/aether-mailer/app/static/
COPY --from=frontend-builder --chown=mailer:mailer /app/cli/dist /opt/aether-mailer/cli/

# Copy configurations
COPY --chown=mailer:mailer prisma/ /opt/aether-mailer/prisma/
COPY --chown=mailer:mailer docker-entrypoint.sh /opt/aether-mailer/

# Install global binaries and create symlinks
RUN npm install -g prisma && \
    ln -sf /opt/aether-mailer/cli/main.js /usr/local/bin/mailer && \
    ln -sf /opt/aether-mailer/bin/main /usr/local/bin/aether-server && \
    chmod +x /usr/local/bin/mailer /usr/local/bin/aether-server

# Setup SSH environment
RUN ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key -N "" && \
    ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N "" && \
    chown -R ssh-user:ssh-users /home/ssh-user && \
    echo "ssh-user ALL=(ALL) NOPASSWD: /usr/local/bin/mailer" >> /etc/sudoers

# Set proper permissions for scripts
RUN chmod +x /opt/aether-mailer/docker-entrypoint.sh && \
    chmod +x /usr/bin/container-init.sh && \
    chmod +x /usr/bin/container-health.sh && \
    chmod +x /usr/bin/container-cleanup.sh && \
    chmod +x /usr/bin/mailer-shell.sh && \
    chmod +x /usr/bin/ssh-auth.sh

# Create working directory
WORKDIR /opt/aether-mailer

# Set ownership
USER root

# Expose public ports
EXPOSE 3000 2222

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/bin/container-health.sh

# Environment variables
ENV NODE_ENV=production \
    GO_ENV=production \
    DATABASE_PROVIDER=postgresql \
    POSTGRES_DB=aether_mailer \
    POSTGRES_USER=mailer \
    POSTGRES_PASSWORD=mailer_postgres \
    SSH_PORT=2222 \
    SSH_USER=ssh-user \
    SSH_AUTH_SERVICE_URL="" \
    SSH_ENABLE_LOCAL_AUTH="true"

# Container entrypoint
ENTRYPOINT ["/usr/bin/container-init.sh"]
CMD ["/opt/aether-mailer/docker-entrypoint.sh"]