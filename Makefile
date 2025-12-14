# Aether Mailer Makefile
# Modern mail server foundation with monorepo architecture

.PHONY: help install dev build test lint clean docker db cli release

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
docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(RESET)"
	@docker build -t $(PROJECT_NAME):$(VERSION) .
	@docker tag $(PROJECT_NAME):$(VERSION) $(PROJECT_NAME):latest

docker-run: ## Run with Docker Compose
	@echo "$(BLUE)Starting services with Docker Compose...$(RESET)"
	@docker-compose up -d

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

# Welcome Message
welcome: ## Show welcome message
	@echo "$(BLUE)Welcome to $(PROJECT_NAME) v$(VERSION)!$(RESET)"
	@echo ""
	@echo "$(GREEN)Quick start:$(RESET)"
	@echo "  make quick-start    # Install and start development"
	@echo "  make dev            # Start development servers"
	@echo "  make build          # Build all packages"
	@echo "  make test           # Run tests"
	@echo ""
	@echo "$(YELLOW)For all commands, run: make help$(RESET)"