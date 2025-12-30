# Aether Mailer Makefile
# Modern mail server foundation with monorepo architecture

.PHONY: help install dev build test lint clean docker-build docker-run docker-compose-up docker db cli release pkg-install pkg-update pkg-add pkg-add-dev pkg-remove pkg-outdated pkg-audit pkg-audit-fix pkg-list pkg-clean pkg-why sys-install sys-clean sys-dev-frontend sys-dev-backend sys-build-frontend sys-lint sys-format sys-typecheck sys-status sys-logs sys-ports sys-processes sys-env sys-docker-build sys-docker-run sys-docker-stop sys-git-status sys-git-log docker-cli docker-exec docker-ssh docker-ssh-setup docker-ssh-test docker-dev docker-dev-build docker-dev-up docker-dev-down docker-dev-logs docker-dev-shell docker-dev-clean docker-dev-restart docker-dev-status docker-dev-db docker-dev-gui

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# Project info
PROJECT_NAME := aether-mailer
VERSION := 0.1.0

help: ## Show this help message
	@echo "$(BLUE)$(PROJECT_NAME) v$(VERSION) - Modern Mail Server Foundation$(RESET)"
	@echo ""
	@echo "$(GREEN)Available commands:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation & Setup
install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	@pnpm install

install-fresh: ## Clean install all dependencies
	@echo "$(BLUE)Performing fresh install...$(RESET)"
	@rm -rf node_modules pnpm-lock.yaml
	@pnpm install

# Development
dev: ## Start all development services (frontend + backend)
	@echo "$(BLUE)Starting development servers...$(RESET)"
	@pnpm dev

dev-frontend: ## Start frontend development server only
	@echo "$(BLUE)Starting frontend development server...$(RESET)"
	@pnpm dev:frontend

dev-backend: ## Start backend development server only
	@echo "$(BLUE)Starting backend development server...$(RESET)"
	@pnpm dev:backend

dev-cli: ## Start CLI in development mode
	@echo "$(BLUE)Starting CLI development mode...$(RESET)"
	@pnpm dev:cli

# Building
build: ## Build all packages
	@echo "$(BLUE)Building all packages...$(RESET)"
	@pnpm build

build-frontend: ## Build frontend only
	@echo "$(BLUE)Building frontend...$(RESET)"
	@pnpm build:frontend

build-backend: ## Build backend only
	@echo "$(BLUE)Building backend...$(RESET)"
	@pnpm build:backend

build-cli: ## Build CLI only
	@echo "$(BLUE)Building CLI...$(RESET)"
	@pnpm build:cli

# Production
start: ## Start all production services
	@echo "$(BLUE)Starting production services...$(RESET)"
	@pnpm start

start-frontend: ## Start frontend production server
	@echo "$(BLUE)Starting frontend production server...$(RESET)"
	@pnpm --filter app start

start-backend: ## Start backend production server
	@echo "$(BLUE)Starting backend production server...$(RESET)"
	@pnpm --filter server start

# Code Quality
lint: ## Lint all packages
	@echo "$(BLUE)Linting all packages...$(RESET)"
	@pnpm lint

lint-fix: ## Fix linting issues in all packages
	@echo "$(BLUE)Fixing linting issues...$(RESET)"
	@pnpm lint:fix

typecheck: ## Type check all packages
	@echo "$(BLUE)Type checking all packages...$(RESET)"
	@pnpm typecheck

format: ## Format all code with Prettier
	@echo "$(BLUE)Formatting code...$(RESET)"
	@pnpm prettier --write .

# Testing
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(RESET)"
	@pnpm test

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(RESET)"
	@pnpm test:watch

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(RESET)"
	@pnpm test:coverage

# Database
db-generate: ## Generate Prisma client
	@echo "$(BLUE)Generating Prisma client...$(RESET)"
	@pnpm db:generate

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(RESET)"
	@pnpm db:migrate

db-studio: ## Open Prisma Studio
	@echo "$(BLUE)Opening Prisma Studio...$(RESET)"
	@pnpm db:studio

db-seed: ## Seed database with development data
	@echo "$(BLUE)Seeding database...$(RESET)"
	@pnpm db:seed

db-reset: ## Reset database
	@echo "$(BLUE)Resetting database...$(RESET)"
	@pnpm db:reset

# CLI Commands
cli: ## Run CLI interface
	@echo "$(BLUE)Starting CLI...$(RESET)"
	@pnpm cli

cli-install: ## Install CLI globally
	@echo "$(BLUE)Installing CLI globally...$(RESET)"
	@pnpm --filter cli link

# Docker
docker-build: ## Build Docker image (equivalent to docker build --no-cache -f Dockerfile -t aether-mailer .)
	@echo "$(BLUE)Building Docker image...$(RESET)"
	@docker build --no-cache -f Dockerfile -t aether-mailer .

docker-run: ## Run Docker container with Caddy gateway (single public port 3000, internal services on 8080)
	@echo "$(BLUE)Removing existing container if exists...$(RESET)"
	@docker stop aether-mailer 2>/dev/null || true
	@docker rm aether-mailer 2>/dev/null || true
	@echo "$(BLUE)Running Docker container with Caddy reverse proxy...$(RESET)"
	@echo "$(GREEN)Public access: http://localhost:3000$(RESET)"
	@echo "$(GREEN)Frontend: http://localhost:3000 (via Caddy)$(RESET)"
	@echo "$(GREEN)API: http://localhost:3000/api/v1/* (via Caddy)$(RESET)"
	@echo "$(GREEN)Health: http://localhost:3000/health (via Caddy)$(RESET)"
	@echo "$(YELLOW)Internal services (not exposed): backend:8080, frontend:3001$(RESET)"
	@docker run -d --name aether-mailer -p 3000:3000 aether-mailer

docker-compose-up: ## Run with Docker Compose (legacy)
	@echo "$(BLUE)Starting services with Docker Compose...$(RESET)"
	@docker-compose up -d

docker-logs: ## Show Docker container logs
	@echo "$(BLUE)Showing container logs...$(RESET)"
	@docker logs -f aether-mailer

docker-stop: ## Stop and remove Docker container
	@echo "$(BLUE)Stopping and removing container...$(RESET)"
	@docker stop aether-mailer 2>/dev/null || true
	@docker rm aether-mailer 2>/dev/null || true

docker-exec: ## Execute command in container (usage: make docker-exec CMD="command")
	@if [ -z "$(CMD)" ]; then \
		echo "$(RED)Error: Please specify CMD='command'$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Executing command in container: $(CMD)$(RESET)"
	@docker exec -it aether-mailer /bin/sh -c "$(CMD)"

docker-shell: ## Open shell in running container
	@echo "$(BLUE)Opening shell in container...$(RESET)"
	@docker exec -it aether-mailer /bin/sh

docker-cli: ## Connect to container and run CLI interface
	@echo "$(BLUE)Connecting to container CLI...$(RESET)"
	@echo "$(GREEN)Available commands: mailer [command]$(RESET)"
	@echo "$(YELLOW)Type 'exit' to return to host$(RESET)"
	@docker exec -it aether-mailer /bin/sh -c "cd /app && exec /bin/sh"

docker-ssh: ## SSH into container (usage: make docker-ssh)
	@echo "$(BLUE)Connecting via SSH to container...$(RESET)"
	@ssh -p 2222 ssh-user@localhost || echo "$(YELLOW)Container may not be running. Use 'make docker-run' first.$(RESET)"

docker-ssh-setup: ## Setup SSH access with external authentication service
	@echo "$(BLUE)Setting up SSH access...$(RESET)"
	@if [ -z "$(SSH_AUTH_SERVICE_URL)" ]; then \
		echo "$(YELLOW)Setting up local authentication for testing...$(RESET)"; \
		echo "ssh-user:password123" | docker exec -i aether-mailer chpasswd; \
	else \
		echo "$(GREEN)Using external authentication service: $(SSH_AUTH_SERVICE_URL)$(RESET)"; \
	fi
	@echo "$(GREEN)SSH access configured. Use 'make docker-ssh' to connect.$(RESET)"

docker-ssh-test: ## Test SSH connection and authentication
	@echo "$(BLUE)Testing SSH connection...$(RESET)"
	@echo "Testing local authentication..."
	@docker exec -it aether-mailer /usr/local/bin/ssh-auth.sh test ssh-user password123 && echo "$(GREEN)✓ Authentication test passed$(RESET)" || echo "$(RED)✗ Authentication test failed$(RESET)"
	@echo ""
	@echo "Testing SSH service..."
	@ssh -o BatchMode=yes -o ConnectTimeout=5 -p 2222 ssh-user@localhost "echo 'SSH connection successful'" 2>/dev/null && echo "$(GREEN)✓ SSH connection test passed$(RESET)" || echo "$(YELLOW)⚠ SSH connection test failed - container may need to be restarted$(RESET)"

# Docker Development Environment
docker-dev: ## Start development environment with hot reload
	@echo "$(BLUE)Starting Docker development environment...$(RESET)"
	@echo "$(GREEN)Services will be available at:$(RESET)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8080"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis: localhost:6379"
	@docker-compose -f docker-compose.dev.yml up --build

docker-dev-build: ## Build development Docker image only
	@echo "$(BLUE)Building development Docker image...$(RESET)"
	@docker-compose -f docker-compose.dev.yml build

docker-dev-up: ## Start development environment (detached)
	@echo "$(BLUE)Starting development environment in background...$(RESET)"
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Environment started. Use 'make docker-dev-logs' to view logs.$(RESET)"

docker-dev-down: ## Stop development environment
	@echo "$(BLUE)Stopping development environment...$(RESET)"
	@docker-compose -f docker-compose.dev.yml down

docker-dev-logs: ## Show development environment logs
	@echo "$(BLUE)Showing development logs...$(RESET)"
	@docker-compose -f docker-compose.dev.yml logs -f

docker-dev-shell: ## Open shell in development container
	@echo "$(BLUE)Opening shell in development container...$(RESET)"
	@docker-compose -f docker-compose.dev.yml exec app-dev /bin/sh

docker-dev-clean: ## Clean development environment (remove containers and volumes)
	@echo "$(BLUE)Cleaning development environment...$(RESET)"
	@docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	@docker system prune -f

docker-dev-restart: ## Restart development environment
	@echo "$(BLUE)Restarting development environment...$(RESET)"
	@make docker-dev-down
	@make docker-dev-up

docker-dev-status: ## Show development environment status
	@echo "$(BLUE)Development Environment Status:$(RESET)"
	@docker-compose -f docker-compose.dev.yml ps

docker-dev-db: ## Connect to development database
	@echo "$(BLUE)Connecting to development database...$(RESET)"
	@docker-compose -f docker-compose.dev.yml exec postgres psql -U mailer -d aether_mailer_dev

docker-dev-gui: ## Start development environment with GUI tools
	@echo "$(BLUE)Starting development environment with GUI tools...$(RESET)"
	@echo "$(GREEN)GUI tools will be available at:$(RESET)"
	@echo "  pgAdmin: http://localhost:5050"
	@echo "  Redis Commander: http://localhost:8081"
	@docker-compose -f docker-compose.dev.yml --profile gui up --build

docker-stop: ## Stop Docker Compose services
	@echo "$(BLUE)Stopping Docker Compose services...$(RESET)"
	@docker-compose down

docker-logs: ## Show Docker logs
	@echo "$(BLUE)Showing Docker logs...$(RESET)"
	@docker-compose logs -f

docker-clean: ## Clean Docker resources
	@echo "$(BLUE)Cleaning Docker resources...$(RESET)"
	@docker-compose down -v --remove-orphans
	@docker system prune -f

# Maintenance
clean: ## Clean build artifacts and dependencies
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	@pnpm clean

clean-all: ## Clean everything including node_modules
	@echo "$(BLUE)Deep cleaning...$(RESET)"
	@pnpm clean
	@rm -rf node_modules
	@find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

reset: ## Reset project to clean state
	@echo "$(BLUE)Resetting project...$(RESET)"
	@make clean-all
	@make install

# Release Management
version: ## Bump version using changesets
	@echo "$(BLUE)Versioning packages...$(RESET)"
	@pnpm version-packages

release: ## Create a new release
	@echo "$(BLUE)Creating release...$(RESET)"
	@make build
	@pnpm release

# Development Utilities
status: ## Show project status
	@echo "$(BLUE)Project Status:$(RESET)"
	@echo "  Name: $(PROJECT_NAME)"
	@echo "  Version: $(VERSION)"
	@echo "  Node.js: $(shell node --version)"
	@echo "  pnpm: $(shell pnpm --version)"
	@echo ""
	@echo "$(BLUE)Workspace Status:$(RESET)"
	@pnpm list --depth=0

logs: ## Show development logs
	@echo "$(BLUE)Showing development logs...$(RESET)"
	@tail -f logs/*.log 2>/dev/null || echo "No log files found"

health: ## Check system health
	@echo "$(BLUE)Checking system health...$(RESET)"
	@curl -s http://localhost:8080/health > /dev/null && echo "$(GREEN)✓ Backend is healthy$(RESET)" || echo "$(RED)✗ Backend is not responding$(RESET)"
	@curl -s http://localhost:3000 > /dev/null && echo "$(GREEN)✓ Frontend is running$(RESET)" || echo "$(RED)✗ Frontend is not responding$(RESET)"

# Security
audit: ## Audit dependencies for security issues
	@echo "$(BLUE)Auditing dependencies...$(RESET)"
	@pnpm audit

audit-fix: ## Fix security vulnerabilities
	@echo "$(BLUE)Fixing security vulnerabilities...$(RESET)"
	@pnpm audit --fix

# Documentation
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(RESET)"
	@echo "Documentation generation not yet implemented"

docs-serve: ## Serve documentation locally
	@echo "$(BLUE)Serving documentation...$(RESET)"
	@echo "Documentation serving not yet implemented"

# Quick Start Commands
quick-start: ## Quick start for new developers
	@echo "$(BLUE)Quick starting $(PROJECT_NAME)...$(RESET)"
	@make install
	@make db-migrate
	@make dev

quick-prod: ## Quick production setup
	@echo "$(BLUE)Setting up production environment...$(RESET)"
	@make install
	@make build
	@make start

# Environment Management
env-dev: ## Setup development environment
	@echo "$(BLUE)Setting up development environment...$(RESET)"
	@if [ ! -f .env ]; then cp .env.example .env; echo "$(GREEN)✓ Created .env from example$(RESET)"; fi
	@echo "$(YELLOW)⚠️  Please edit .env with your configuration$(RESET)"

env-prod: ## Setup production environment
	@echo "$(BLUE)Setting up production environment...$(RESET)"
	@if [ ! -f .env.production ]; then cp .env.example .env.production; echo "$(GREEN)✓ Created .env.production from example$(RESET)"; fi
	@echo "$(YELLOW)⚠️  Please edit .env.production with your production configuration$(RESET)"

# Git Hooks
hooks-install: ## Install git hooks
	@echo "$(BLUE)Installing git hooks...$(RESET)"
	@pnpm prepare

hooks-uninstall: ## Uninstall git hooks
	@echo "$(BLUE)Uninstalling git hooks...$(RESET)"
	@rm -rf .husky/_

# Performance
perf-build: ## Build with performance analysis
	@echo "$(BLUE)Building with performance analysis...$(RESET)"
	@NODE_ENV=production pnpm build

perf-analyze: ## Analyze bundle size
	@echo "$(BLUE)Analyzing bundle size...$(RESET)"
	@echo "Bundle analysis not yet implemented"

# Backup & Recovery
backup: ## Create project backup
	@echo "$(BLUE)Creating backup...$(RESET)"
	@tar -czf ../$(PROJECT_NAME)-backup-$(shell date +%Y%m%d-%H%M%S).tar.gz --exclude=node_modules --exclude=.git --exclude=dist --exclude=.next .

restore-backup: ## Restore from backup (usage: make restore-backup BACKUP=filename)
	@if [ -z "$(BACKUP)" ]; then echo "$(RED)Error: Please specify BACKUP=filename$(RESET)"; exit 1; fi
	@echo "$(BLUE)Restoring from backup: $(BACKUP)$(RESET)"
	@tar -xzf $(BACKUP)

# Monitoring
monitor: ## Start monitoring tools
	@echo "$(BLUE)Starting monitoring...$(RESET)"
	@echo "Monitoring tools not yet implemented"

metrics: ## Show project metrics
	@echo "$(BLUE)Project Metrics:$(RESET)"
	@echo "  Lines of code: $(shell find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | xargs wc -l | tail -1)"
	@echo "  Package count: $(shell find . -name "package.json" | grep -v node_modules | wc -l)"
	@echo "  Test files: $(shell find . -name "*.test.*" -o -name "*.spec.*" | grep -v node_modules | wc -l)"

# Advanced Development
dev-full: ## Start all services including monitoring
	@echo "$(BLUE)Starting full development environment...$(RESET)"
	@make dev
	@make monitor &

dev-debug: ## Start development with debugging
	@echo "$(BLUE)Starting development with debugging...$(RESET)"
	@NODE_OPTIONS='--inspect' pnpm dev

# CI/CD Helpers
ci-install: ## Install dependencies for CI
	@echo "$(BLUE)Installing for CI...$(RESET)"
	@pnpm install --frozen-lockfile --prod=false

ci-build: ## Build for CI
	@echo "$(BLUE)Building for CI...$(RESET)"
	@NODE_ENV=production pnpm build

ci-test: ## Run tests for CI
	@echo "$(BLUE)Running tests for CI...$(RESET)"
	@pnpm test --ci

# Utility Commands
tree: ## Show project tree structure
	@echo "$(BLUE)Project Structure:$(RESET)"
	@tree -I 'node_modules|.git|dist|.next' -L 3

ports: ## Show used ports
	@echo "$(BLUE)Used Ports:$(RESET)"
	@lsof -i :3000 -i :8080 -i :5432 2>/dev/null || echo "No services running on standard ports"

deps: ## Show dependency tree
	@echo "$(BLUE)Dependency Tree:$(RESET)"
	@pnpm list --depth=1

deps-outdated: ## Show outdated dependencies
	@echo "$(BLUE)Outdated Dependencies:$(RESET)"
	@pnpm outdated

# Error Handling
check-deps: ## Check if all dependencies are installed
	@echo "$(BLUE)Checking dependencies...$(RESET)"
	@pnpm list --depth=0 || (echo "$(RED)Dependencies missing. Run 'make install'$(RESET)" && exit 1)

# Package Management Commands
pkg-install: ## Install dependencies (auto-detects pnpm/npm)
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm install; \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm install; \
	fi

pkg-update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm update; \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm update; \
	fi

pkg-add: ## Add package (usage: make pkg-add PKG=package-name)
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: Please specify PKG=package-name$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Adding package: $(PKG)$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm add $(PKG); \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm install $(PKG); \
	fi

pkg-add-dev: ## Add dev package (usage: make pkg-add-dev PKG=package-name)
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: Please specify PKG=package-name$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Adding dev package: $(PKG)$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm add -D $(PKG); \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm install $(PKG) --save-dev; \
	fi

pkg-remove: ## Remove package (usage: make pkg-remove PKG=package-name)
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: Please specify PKG=package-name$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Removing package: $(PKG)$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm remove $(PKG); \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm uninstall $(PKG); \
	fi

pkg-outdated: ## Show outdated packages
	@echo "$(BLUE)Checking outdated packages...$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm outdated; \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm outdated; \
	fi

pkg-audit: ## Audit dependencies for security
	@echo "$(BLUE)Auditing dependencies...$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm audit; \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm audit; \
	fi

pkg-audit-fix: ## Fix security vulnerabilities
	@echo "$(BLUE)Fixing security vulnerabilities...$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm audit --fix; \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm audit fix; \
	fi

pkg-list: ## List installed packages
	@echo "$(BLUE)Installed packages:$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm list --depth=0; \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm list --depth=0; \
	fi

pkg-clean: ## Clean package manager cache
	@echo "$(BLUE)Cleaning package cache...$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm store prune; \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm cache clean --force; \
	fi

pkg-why: ## Show why package is installed (usage: make pkg-why PKG=package-name)
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: Please specify PKG=package-name$(RESET)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Why $(PKG) is installed:$(RESET)"
	@if command -v pnpm >/dev/null 2>&1; then \
		pnpm why $(PKG); \
	else \
		echo "$(YELLOW)pnpm not found, using npm...$(RESET)"; \
		npm why $(PKG); \
	fi

# System Commands (without pnpm)
sys-install: ## Install using npm instead of pnpm
	@echo "$(BLUE)Installing dependencies with npm...$(RESET)"
	@npm install

sys-clean: ## Clean using system tools
	@echo "$(BLUE)Cleaning with system tools...$(RESET)"
	@rm -rf node_modules package-lock.json
	@find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "*.log" -delete 2>/dev/null || true

sys-dev-frontend: ## Start frontend with next dev directly
	@echo "$(BLUE)Starting frontend with Next.js...$(RESET)"
	@cd app && npx next dev

sys-dev-backend: ## Start backend with node directly
	@echo "$(BLUE)Starting backend server...$(RESET)"
	@cd server && npm run dev

sys-build-frontend: ## Build frontend with next build directly
	@echo "$(BLUE)Building frontend with Next.js...$(RESET)"
	@cd app && npx next build

sys-lint: ## Lint with eslint directly
	@echo "$(BLUE)Linting with ESLint...$(RESET)"
	@npx eslint . --ext .ts,.tsx,.js,.jsx

sys-format: ## Format with prettier directly
	@echo "$(BLUE)Formatting with Prettier...$(RESET)"
	@npx prettier --write .

sys-typecheck: ## Type check with tsc directly
	@echo "$(BLUE)Type checking with TypeScript...$(RESET)"
	@npx tsc --noEmit

sys-status: ## Show system status without pnpm
	@echo "$(BLUE)System Status:$(RESET)"
	@echo "  Name: $(PROJECT_NAME)"
	@echo "  Version: $(VERSION)"
	@echo "  Node.js: $(shell node --version)"
	@echo "  npm: $(shell npm --version)"
	@echo ""
	@echo "$(BLUE)Project Size:$(RESET)"
	@du -sh . --exclude=node_modules --exclude=.git --exclude=dist --exclude=.next

sys-logs: ## Show logs with system tools
	@echo "$(BLUE)System logs:$(RESET)"
	@journalctl -u npm 2>/dev/null || echo "No systemd npm logs found"
	@tail -f /var/log/npm-debug.log 2>/dev/null || echo "No npm debug log found"

sys-ports: ## Check ports with system tools
	@echo "$(BLUE)Port status:$(RESET)"
	@netstat -tlnp 2>/dev/null | grep -E ':(3000|8080|5432)' || ss -tlnp | grep -E ':(3000|8080|5432)' || echo "No services found on standard ports"

sys-processes: ## Show running processes
	@echo "$(BLUE)Running processes:$(RESET)"
	@ps aux | grep -E '(node|next|npm)' | grep -v grep || echo "No Node.js processes found"

sys-env: ## Show environment variables
	@echo "$(BLUE)Environment variables:$(RESET)"
	@echo "  NODE_ENV: $(NODE_ENV)"
	@echo "  PATH: $(PATH)"
	@echo "  PWD: $(PWD)"

# Docker system commands
sys-docker-build: ## Build with docker directly
	@echo "$(BLUE)Building Docker image...$(RESET)"
	@docker build -t $(PROJECT_NAME):$(VERSION) .

sys-docker-run: ## Run docker container directly
	@echo "$(BLUE)Running Docker container...$(RESET)"
	@docker run -d -p 3000:3000 -p 8080:8080 --name $(PROJECT_NAME) $(PROJECT_NAME):$(VERSION)

sys-docker-stop: ## Stop docker container
	@echo "$(BLUE)Stopping Docker container...$(RESET)"
	@docker stop $(PROJECT_NAME) || true
	@docker rm $(PROJECT_NAME) || true

# Git system commands
sys-git-status: ## Git status with system tools
	@echo "$(BLUE)Git status:$(RESET)"
	@git status --porcelain

sys-git-log: ## Git log with system tools
	@echo "$(BLUE)Recent commits:$(RESET)"
	@git log --oneline -10

# Welcome Message
welcome: ## Show welcome message
	@echo "$(BLUE)Welcome to $(PROJECT_NAME) v$(VERSION)!$(RESET)"
	@echo ""
	@echo "$(GREEN)Quick start:$(RESET)"
	@echo "  make quick-start    # Install and start development"
	@echo "  make dev            # Start development servers"
	@echo "  make docker-dev     # Start Docker development environment"
	@echo "  make build          # Build all packages"
	@echo "  make test           # Run tests"
	@echo ""
	@echo "$(YELLOW)Docker Development:$(RESET)"
	@echo "  make docker-dev     # Start dev environment with hot reload"
	@echo "  make docker-dev-up  # Start in background"
	@echo "  make docker-dev-gui # Start with GUI tools (pgAdmin, Redis)"
	@echo "  make docker-dev-db  # Connect to dev database"
	@echo "  make docker-dev-logs # View logs"
	@echo "  make docker-dev-down # Stop environment"
	@echo ""
	@echo "$(YELLOW)Package management (auto-detects pnpm/npm):$(RESET)"
	@echo "  make pkg-install    # Install dependencies"
	@echo "  make pkg-update     # Update dependencies"
	@echo "  make pkg-add PKG=name # Add package"
	@echo "  make pkg-remove PKG=name # Remove package"
	@echo "  make pkg-audit      # Security audit"
	@echo ""
	@echo "$(YELLOW)System commands (no pnpm):$(RESET)"
	@echo "  make sys-install    # Install with npm"
	@echo "  make sys-dev-frontend # Start frontend directly"
	@echo "  make sys-build-frontend # Build frontend directly"
	@echo "  make sys-lint       # Lint with ESLint"
	@echo "  make sys-format     # Format with Prettier"
	@echo ""
	@echo "$(YELLOW)For all commands, run: make help$(RESET)"