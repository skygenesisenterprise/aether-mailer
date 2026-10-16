# syntax=docker/dockerfile:1
#
# Notploy — single canonical Dockerfile for the main product.
#
# Built from the repository root: the whole monorepo is one pnpm workspace with
# a single `pnpm-lock.yaml`, so only the root context is ever used.
#
#   docker build -t notploy .                      # self-hosted (default target)
#   docker build --target cloud -t notploy-cloud . # cloud (no build tooling)
#   docker build --target dev -t notploy-dev .     # development image
#   docker buildx build --target selfhosted .
#
# Stages / targets
#   base        Node + pnpm toolchain
#   dev         dependencies only, runs `pnpm dev` (hot-reload via compose)
#   builder     installs + compiles the app, deploys a pruned /prod/notploy
#   runtime     shared production runtime (artifacts, healthcheck, entrypoint)
#   cloud       FROM runtime; Notploy Cloud (same app, no self-hosted tooling)
#   selfhosted  FROM runtime + Docker/nixpacks/railpack/pack (LAST => default)
#
# The deployment tooling (docker CLI, nixpacks, railpack, git-lfs, ...) is
# installed by docker/install-deploy-tooling.sh, shared by the `dev` and
# `selfhosted` stages so a dev container drives Docker exactly like production.
#
# Runtime note: Notploy manages the host Docker Engine through the mounted
# /var/run/docker.sock and writes state to /etc/notploy and /root/.docker, both
# of which require root inside the container. This is socket access to the host
# engine, NOT Docker-in-Docker.

# ---------------------------------------------------------------------------
# Toolchain
# ---------------------------------------------------------------------------
FROM node:24.4.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@10.22.0 --activate
# openssl signs the local instance identity at container start (see
# entrypoint.sh) with the same code path as install.sh; ca-certificates keeps
# outbound TLS verification working in the slim image.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Development image (dependencies + the deployment tooling; never runs Next's
# production build). The `dev` compose service bind-mounts apps/notploy and
# packages over this stage's sources, so the server always runs the code on
# the host and hot-reloads it.
# ---------------------------------------------------------------------------
FROM base AS dev
COPY . /usr/src/app
WORKDIR /usr/src/app

# Build toolchain (native modules) plus the deployment tooling, so a dev
# container behaves like the production one (docker CLI, nixpacks, railpack,
# pack): without it every Docker page fails with `docker: not found`.
RUN apt-get update && apt-get install -y python3 make g++ git python3-pip pkg-config libsecret-1-dev && rm -rf /var/lib/apt/lists/*

COPY --chmod=0755 docker/install-deploy-tooling.sh /tmp/install-deploy-tooling.sh
RUN /tmp/install-deploy-tooling.sh && rm -f /tmp/install-deploy-tooling.sh

COPY --from=buildpacksio/pack:0.39.1 /usr/local/bin/pack /usr/local/bin/pack

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

ENV NODE_ENV=development

# All launch logic (wait for DB, migrations, server) lives in entrypoint.sh.
COPY --chmod=0755 entrypoint.sh /usr/local/bin/entrypoint.sh
# install.sh doubles as a library (NOTPLOY_SOURCE_ONLY=1): the entrypoint sources
# it to bootstrap the instance identity with a single source of truth.
COPY --chmod=0755 install.sh /usr/local/bin/notploy-install.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# ---------------------------------------------------------------------------
# Builder (production artifacts)
# ---------------------------------------------------------------------------
FROM base AS builder
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y python3 make g++ git python3-pip pkg-config libsecret-1-dev && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Public build-time configuration (cloud builds only; empty for self-hosted).
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# The build reads .env.production (esbuild bakes its values as build-time
# defines, and the file becomes /app/.env at runtime). The committed example
# only carries safe defaults (PORT, NODE_ENV), which keeps this stage
# reproducible and lets `docker build .` work with an unprepared context.
COPY apps/notploy/.env.production.example ./.env.production

# Next.js otherwise phones home (telemetry) and tries to enable its own
# anonymous usage reporting during the build; disabling it removes a network
# round-trip from every CI build without changing the produced artifacts.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter=@notploy/server build
RUN pnpm --filter=./apps/notploy run build

RUN pnpm --filter=./apps/notploy --prod deploy --legacy /prod/notploy

RUN cp -R /usr/src/app/apps/notploy/.next /prod/notploy/.next
RUN cp -R /usr/src/app/apps/notploy/dist /prod/notploy/dist

# ---------------------------------------------------------------------------
# Shared production runtime
# ---------------------------------------------------------------------------
FROM base AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y tini curl unzip zip apache2-utils && rm -rf /var/lib/apt/lists/*

# Copy only what the runtime needs
COPY --from=builder /prod/notploy/.next ./.next
COPY --from=builder /prod/notploy/dist ./dist
COPY --from=builder /prod/notploy/next.config.mjs ./next.config.mjs
COPY --from=builder /prod/notploy/public ./public
COPY --from=builder /prod/notploy/package.json ./package.json
COPY --from=builder /prod/notploy/drizzle ./drizzle
COPY --from=builder /prod/notploy/components.json ./components.json
COPY --from=builder /prod/notploy/node_modules ./node_modules
# Safe defaults only (PORT, NODE_ENV); real configuration is injected at runtime.
COPY apps/notploy/.env.production.example ./.env

# rclone (backup destinations) and tsx (runtime scripts) are shared by both
# cloud and self-hosted.
RUN curl https://rclone.org/install.sh | bash && pnpm install -g tsx

ARG NOTPLOY_VERSION=dev
LABEL org.opencontainers.image.title="notploy" \
      org.opencontainers.image.description="Notploy (dashboard, server and build tooling)" \
      org.opencontainers.image.source="https://github.com/skygenesisenterprise/notploy" \
      org.opencontainers.image.version="${NOTPLOY_VERSION}" \
      org.opencontainers.image.licenses="Apache-2.0"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fs http://localhost:3000/api/trpc/settings.health || exit 1

# All launch logic (wait for DB, migrations, server) lives in entrypoint.sh.
COPY --chmod=0755 entrypoint.sh /usr/local/bin/entrypoint.sh
# Same identity bootstrap as install.sh (see the dev stage above).
COPY --chmod=0755 install.sh /usr/local/bin/notploy-install.sh

# tini reaps child processes that the entrypoint/server leave defunct.
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]

# ---------------------------------------------------------------------------
# Notploy Cloud — same application without the self-hosted build tooling.
# ---------------------------------------------------------------------------
FROM runtime AS cloud

# ---------------------------------------------------------------------------
# Notploy Console — the instance/fleet management plane. Same runtime as Cloud;
# what it may do is decided by its `console` product entitlement at runtime, not
# by the image contents. Kept before `selfhosted` so `selfhosted` stays the
# default target (the last stage in the file).
# ---------------------------------------------------------------------------
FROM runtime AS console

# ---------------------------------------------------------------------------
# Notploy Status — the standalone status page (apps/status + the packages/status
# engine). Deliberately independent from the control plane: no PostgreSQL, no
# Redis, no Docker socket, no instance identity. The engine owns a dedicated
# SQLite file under STATUS_DATA_DIR, so the whole product is one container and
# one volume.
#
#   docker build --target status     -t notploy-status .      # production
#   docker build --target status-dev -t notploy-status-dev .  # development
#
# The production image ships Next's `output: "standalone"` bundle, so it does
# not carry the monorepo or its pnpm store.
# ---------------------------------------------------------------------------
FROM base AS status-builder
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Status app bundle: apps/status/.next/standalone (traced dependencies included).
RUN pnpm --filter=./apps/status run build
# Engine bundle: packs the seed CLI so the runtime image can bootstrap its
# catalog without a TypeScript runner.
RUN pnpm --filter=@notploy/status run build

FROM base AS status
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4100
ENV HOSTNAME=0.0.0.0
RUN apt-get update && apt-get install -y --no-install-recommends tini curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# Self-contained server: node_modules is the traced subset, not the workspace.
COPY --from=status-builder /usr/src/app/apps/status/.next/standalone ./
COPY --from=status-builder /usr/src/app/apps/status/.next/static ./apps/status/.next/static
# Seed CLI (bundled): resolves `zod`/`hono` from the traced node_modules above.
COPY --from=status-builder /usr/src/app/packages/status/dist ./engine-dist

ARG NOTPLOY_VERSION=dev
LABEL org.opencontainers.image.title="notploy-status" \
      org.opencontainers.image.description="Notploy Status — status page, incidents and uptime history" \
      org.opencontainers.image.source="https://github.com/skygenesisenterprise/notploy" \
      org.opencontainers.image.version="${NOTPLOY_VERSION}" \
      org.opencontainers.image.licenses="Apache-2.0"

EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -fs http://localhost:4100/api/v1/pages || exit 1

# Same entrypoint as every other image: it detects the status application
# (NOTPLOY_APP=status) and execs the standalone server.
COPY --chmod=0755 entrypoint.sh /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]

# ---------------------------------------------------------------------------
# Notploy Status (development) — reuses the `dev` stage (workspace sources +
# dependencies + entrypoint) and only selects the status application. Compose
# bind-mounts apps/status and packages/status over it for hot reload.
# ---------------------------------------------------------------------------
FROM dev AS status-dev
ENV NOTPLOY_APP=status
ENV NEXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------------------------
# Notploy self-hosted — Cloud plus the tooling deployments need on the host.
# This is the default target (last stage in the file).
# ---------------------------------------------------------------------------
FROM runtime AS selfhosted

# Cloud plus the tooling deployments need on the host — same script as the dev
# image, so both flavours expose the same commands.
COPY --chmod=0755 docker/install-deploy-tooling.sh /tmp/install-deploy-tooling.sh
RUN /tmp/install-deploy-tooling.sh && rm -f /tmp/install-deploy-tooling.sh

# Install buildpacks
COPY --from=buildpacksio/pack:0.39.1 /usr/local/bin/pack /usr/local/bin/pack
