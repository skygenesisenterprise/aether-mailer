# Multi-stage build for @app/ frontend
FROM node:20-alpine AS app-base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Build @app/ frontend
FROM app-base AS app-builder
WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy app configuration and source
COPY app/package.json ./app/package.json
COPY app/tsconfig.json app/next.config.ts app/tailwind.config.js app/postcss.config.mjs ./app/
COPY app/components.json app/eslint.config.mjs ./app/
COPY app/ ./app/

# Install dependencies in workspace mode
RUN pnpm install --no-frozen-lockfile

# Build the application
RUN cd app && pnpm build

# Production runner for the app
FROM node:20-alpine AS app-runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=app-builder --chown=nextjs:nodejs /app/app/.next/standalone ./
COPY --from=app-builder --chown=nextjs:nodejs /app/app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["./docker-entrypoint.sh"]