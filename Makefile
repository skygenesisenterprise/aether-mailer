# Notploy — developer & operator interface.
#
# A thin layer over the tools that already exist in the repository (pnpm,
# docker, docker compose). No build or deployment logic is duplicated here:
# every target just calls the corresponding tool or package script.
#
#   make help

SHELL := /bin/bash
.DEFAULT_GOAL := help

# --- Selectable configuration ---------------------------------------------
# NOTPLOY_VERSION overrides the image tag, NOTPLOY_REGISTRY the registry.
# NOTPLOY_PORT is left unset on purpose so docker-compose.yml keeps resolving
# it from .env (or from the 3000 default); pass NOTPLOY_PORT=8080 to override.
#
# The product (self | cloud | console) is deliberately NOT one of them: it can
# only be chosen with a make goal, never by editing this file or .env — see
# "Inline product flag" below. NOTPLOY_FLAVOR / NOTPLOY_PRODUCT / IS_CLOUD are
# derived from it and must not be set by hand.
NOTPLOY_VERSION ?= latest
NOTPLOY_REGISTRY ?= ghcr.io/skygenesisenterprise
# Image of the standalone status page (see the "status" product below).
STATUS_IMAGE ?= $(NOTPLOY_REGISTRY)/notploy-status
# Protected products (cloud/console) need a signed entitlement.
NOTPLOY_ENTITLEMENT ?=
NOTPLOY_ENTITLEMENT_FILE ?=
NOTPLOY_ENTITLEMENT_PUBLIC_KEY_FILE ?=

# --- Inline product flag ---------------------------------------------------
# Select the product for one invocation, without editing .env or exporting
# anything. Works with docker-build, docker-up and docker-dev:
#
#   make docker-up -- --cloud    # cloud (requires a signed entitlement)
#   make docker-dev console      # console (requires a signed entitlement)
#   make docker-up status        # the standalone status page (http://localhost:4100)
#   make docker-dev status       # the status page with hot reload
#
# GNU make itself rejects `make docker-dev --self` (`--self` is parsed as an
# unknown make option before any recipe runs), hence the `--` separator or the
# bare word. Each product maps to its Dockerfile target: self -> selfhosted,
# cloud -> cloud, console -> console, status -> status (and status-dev in dev).
#
# --- Remembered product ----------------------------------------------------
# Each build records the product in PRODUCT_STATE, so a later command reuses
# the product that was built last:
#
#   make docker-up self   # build a fresh image + start self-hosted
#   make docker-up        # start the product built last, without rebuilding
#   make docker-down      # stop the stack — the image is kept for the next start
#
# Precedence: inline product flag > the product recorded by the last build >
# selfhosted. NOTPLOY_FLAVOR= / NOTPLOY_PRODUCT= passed by hand are rejected
# (see the warnings below): the flavor only follows the product.
PRODUCT_STATE := .make-product

# Products: self (default), cloud, console and status. `status` is a separate
# application (the status page), not a flavor of the control plane.
GOAL_PRODUCT := $(firstword $(filter self cloud console status,$(patsubst --%,%,$(MAKECMDGOALS))))

ifneq ($(GOAL_PRODUCT),)
SELECTED_PRODUCT := $(GOAL_PRODUCT)
else ifneq ($(wildcard $(PRODUCT_STATE)),)
SELECTED_PRODUCT := $(shell cat $(PRODUCT_STATE))
else
SELECTED_PRODUCT := self
endif

# NOTPLOY_FLAVOR / NOTPLOY_PRODUCT are derived below: refuse a direct
# assignment instead of silently running a product that was not selected.
ifneq ($(filter $(origin NOTPLOY_FLAVOR),command line environment),)
$(warning NOTPLOY_FLAVOR is derived from the product — use 'make <goal> self|cloud|console' instead; ignoring 'NOTPLOY_FLAVOR=$(NOTPLOY_FLAVOR)')
endif
ifneq ($(filter $(origin NOTPLOY_PRODUCT),command line environment),)
$(warning NOTPLOY_PRODUCT is derived from the product — use 'make <goal> self|cloud|console' instead; ignoring 'NOTPLOY_PRODUCT=$(NOTPLOY_PRODUCT)')
endif

override NOTPLOY_PRODUCT := $(SELECTED_PRODUCT)
# `override` so the selection cannot be bypassed by a command-line assignment:
# the flavor always stays in sync with the chosen product.
ifeq ($(SELECTED_PRODUCT),self)
override NOTPLOY_FLAVOR := selfhosted
else ifeq ($(SELECTED_PRODUCT),status)
# The status page is its own application, not a control-plane flavor. It reuses
# the self-hosted flavor so the shared variables stay defined; the compose
# services it starts never read NOTPLOY_FLAVOR.
override NOTPLOY_FLAVOR := selfhosted
else ifeq ($(SELECTED_PRODUCT),console)
override NOTPLOY_FLAVOR := console
else
override NOTPLOY_FLAVOR := cloud
endif

# Word form of the selected product, written to / read from PRODUCT_STATE.
ifeq ($(SELECTED_PRODUCT),status)
PRODUCT_WORD := status
else ifeq ($(NOTPLOY_FLAVOR),cloud)
PRODUCT_WORD := cloud
else ifeq ($(NOTPLOY_FLAVOR),console)
PRODUCT_WORD := console
else
PRODUCT_WORD := self
endif

# Four products: selfhosted (default, also spelled `self`), cloud, console and
# status. Cloud and console are protected products: they publish a
# cloud/console image and run with IS_CLOUD=true, and the PKI layer requires a
# signed entitlement. `status` publishes the notploy-status image.
ifeq ($(SELECTED_PRODUCT),status)
override NOTPLOY_IMAGE := $(STATUS_IMAGE)
override IS_CLOUD := false
else ifeq ($(NOTPLOY_FLAVOR),cloud)
NOTPLOY_IMAGE ?= $(NOTPLOY_REGISTRY)/notploy-cloud
override IS_CLOUD := true
else ifeq ($(NOTPLOY_FLAVOR),console)
NOTPLOY_IMAGE ?= $(NOTPLOY_REGISTRY)/notploy-console
override IS_CLOUD := false
else
NOTPLOY_IMAGE ?= $(NOTPLOY_REGISTRY)/notploy
override IS_CLOUD := false
endif

PNPM ?= pnpm
COMPOSE ?= docker compose

# --- Host ports the stack publishes -----------------------------------------
# The container always listens on 53; only the host side differs per mode:
#   production (`notploy`)      -> NOTPLOY_DNS_HOST_PORT,     default 53
#   development (`notploy-dev`) -> NOTPLOY_DNS_DEV_HOST_PORT, default 5300
# Port 53 is taken on most developer machines (systemd-resolved, dnsmasq or
# libvirt, Pi-hole) and publishing it aborts the whole stack before a single
# container starts: "Error starting userland proxy: listen tcp4 0.0.0.0:53:
# bind: address already in use". Hence 5300 for the dev stack.
#
# Make does not read .env (compose does): it only resolves the ports here to be
# able to warn *before* compose dies on a bind error. Precedence is the usual
# one — command line / environment, then .env, then the mode's default.
env-file-default = $(or $($(1)),$(shell sed -n 's/^[[:space:]]*$(1)[[:space:]]*=[[:space:]]*\([^#]*\).*/\1/p' .env 2>/dev/null | tail -n 1),$(2))

# Host ports of the control plane (Traefik, app, LAN DNS) for `up` and for
# `dev`. The status page is another application with its own single port.
ifeq ($(SELECTED_PRODUCT),status)
CHECK_PORTS_UP := $(call env-file-default,STATUS_PORT,4100)
CHECK_PORTS_DEV := $(call env-file-default,STATUS_PORT,4100)
else
CHECK_PORTS_UP := $(call env-file-default,NOTPLOY_DNS_HOST_PORT,53) $(call env-file-default,NOTPLOY_PORT,3000) 80 443 8080
CHECK_PORTS_DEV := $(call env-file-default,NOTPLOY_DNS_DEV_HOST_PORT,5300) $(call env-file-default,NOTPLOY_PORT,3000) 80 443 8080
endif

# One recipe line: report every port about to be published that something else
# already holds, with its owner — docker's own error does not say which port it
# was. Ports already published by a running container are ours (a stack being
# restarted) and stay silent. Every statement ends with `;` so the snippet stays
# valid whether $(shell)/recipe expansion keeps or joins its lines.
dns-ports-check = busy() { command -v ss >/dev/null 2>&1 && ss -lntu "sport = :$$1" 2>/dev/null | grep -Eq 'LISTEN|UNCONN'; }; for p in $(1); do if busy "$$p" && [ -z "$$(docker ps -q --filter publish=$$p 2>/dev/null)" ]; then echo "==> WARNING: host port $$p is already in use so the stack cannot start (owner: sudo ss -lntup | grep ':$$p')"; echo "    stop that service or override the port in .env — see the ports section of docker-compose.yml"; fi; done

# Exported to every compose invocation so build target and image tag stay in
# sync with the selected flavor.
COMPOSE_ENV = NOTPLOY_FLAVOR=$(NOTPLOY_FLAVOR) NOTPLOY_IMAGE=$(NOTPLOY_IMAGE) NOTPLOY_VERSION=$(NOTPLOY_VERSION) IS_CLOUD=$(IS_CLOUD) \
	STATUS_IMAGE=$(STATUS_IMAGE) \
	NOTPLOY_PRODUCT=$(NOTPLOY_PRODUCT) NOTPLOY_ENTITLEMENT=$(NOTPLOY_ENTITLEMENT) \
	NOTPLOY_ENTITLEMENT_FILE=$(NOTPLOY_ENTITLEMENT_FILE) NOTPLOY_ENTITLEMENT_PUBLIC_KEY_FILE=$(NOTPLOY_ENTITLEMENT_PUBLIC_KEY_FILE)

# A legacy `notploy-traefik` created outside Compose (install.sh, or the app's
# own traefik-setup) carries no `com.docker.compose.project` label, yet it
# occupies the fixed `container_name: notploy-traefik` the Compose `traefik`
# service needs — so `docker compose up` aborts with "Conflict. The container
# name ... is already in use". Remove it, but only when no Compose label is
# present, so a Compose-managed traefik is left untouched.
CLEAN_EXTERNAL_TRAEFIK = [ -z "$$(docker ps -aq -f 'name=^notploy-traefik$$')" ] || docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' notploy-traefik 2>/dev/null | grep -q . || { echo "==> removing non-Compose notploy-traefik container"; docker rm -f notploy-traefik >/dev/null; }

# `notploy-network` is `external` in docker-compose.yml (it must not be deleted
# by `docker compose down` while deployed apps are attached to it), so Compose no
# longer creates it. Create it here — exactly like install.sh / the server setup
# — before starting the stack on a fresh host.
ENSURE_NETWORK = docker network inspect notploy-network >/dev/null 2>&1 || { echo "==> creating notploy-network"; docker network create --driver overlay --attachable notploy-network >/dev/null; }

# --- Compose selection per product ------------------------------------------
# The status page has its own services and no support stack (no PostgreSQL,
# Redis, Traefik or shared overlay network), so the compose invocations below
# are parameterized instead of hardcoding `notploy` / `notploy-dev`.
ifeq ($(SELECTED_PRODUCT),status)
COMPOSE_BUILD_SERVICE := status
# The service lives in the `status` profile, so the profile is enabled and the
# service named: only `status` starts, never its dev sibling.
COMPOSE_UP_PROFILES := --profile status
COMPOSE_UP_SERVICES := --no-deps status
COMPOSE_DEV_PROFILES := --profile status --profile dev
COMPOSE_DEV_SERVICE := status-dev
# Nothing to prepare: the status stack uses the project's default network and
# does not need the host-wide overlay network or a Traefik cleanup.
STACK_PREPARE = true
else
COMPOSE_BUILD_SERVICE := notploy
COMPOSE_UP_PROFILES :=
COMPOSE_UP_SERVICES :=
COMPOSE_DEV_PROFILES := --profile dev
COMPOSE_DEV_SERVICE := notploy-dev
# Only `notploy` joins the external overlay network and competes for the
# notploy-traefik container name.
STACK_PREPARE = $(CLEAN_EXTERNAL_TRAEFIK) ; $(ENSURE_NETWORK)
endif

.PHONY: help install dev build test typecheck lint \
        docker-build docker-up docker-down docker-restart docker-logs docker-ps docker-config docker-dev \
        self cloud console status --self --cloud --console --status \
        status-seed \
        clean

# No-op goals that only carry the product flag (see GOAL_PRODUCT above). They
# exist so `make docker-build cloud` / `make docker-dev -- --self` have a rule
# to satisfy while the real target reads the product from MAKECMDGOALS.
self cloud console --self --cloud --console:
	@:

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
help: ## Show this help
	@echo "Notploy — available commands:"
	@echo ""
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Variables: NOTPLOY_FLAVOR=$(NOTPLOY_FLAVOR) NOTPLOY_VERSION=$(NOTPLOY_VERSION) NOTPLOY_IMAGE=$(NOTPLOY_IMAGE)"
	@echo "           IS_CLOUD=$(IS_CLOUD) NOTPLOY_PRODUCT=$(PRODUCT_WORD) NOTPLOY_PORT=$${NOTPLOY_PORT:-3000}"
	@echo "           STATUS_PORT=$${STATUS_PORT:-4100} STATUS_IMAGE=$(STATUS_IMAGE)"
	@echo "Product:   $(PRODUCT_WORD)$$(test -f $(PRODUCT_STATE) && echo ' (saved by the last build)')"
	@echo "Identity:  the container bootstraps the instance identity into the"
	@echo "           notploy-config volume at startup (self-hosted needs no network)."
	@echo "Examples:  make docker-up self              # build a fresh image + start self-hosted"
	@echo "           make docker-up                   # restart the image built last, no rebuild"
	@echo "           make docker-up cloud             # build a fresh cloud image + start"
	@echo "           make docker-up -- --console      # build a fresh console image + start"
	@echo "           make docker-build self           # rebuild only, without starting"
	@echo "           make docker-dev                   # dev, product of the last build"
	@echo "           make docker-dev self              # dev, self-hosted (default)"
	@echo "           make docker-dev console           # dev, console (needs entitlement)"
	@echo "           make docker-up status             # build + start the status page (localhost:4100)"
	@echo "           make docker-dev status            # status page with hot reload (localhost:4100)"
	@echo "           make status-seed                  # create the Notploy status page + components"

# ---------------------------------------------------------------------------
# Local development (host toolchain)
# ---------------------------------------------------------------------------
deps: ## Install workspace dependencies (pnpm install --frozen-lockfile)
	$(PNPM) install --frozen-lockfile

dev: ## Run the app in development mode on the host (pnpm dev)
	$(PNPM) dev

build: ## Build the workspace (pnpm build)
	$(PNPM) build

test: ## Run the test suites (pnpm test)
	$(PNPM) test

typecheck: ## Type-check the workspace (pnpm typecheck)
	$(PNPM) typecheck

lint: ## Lint/format check (pnpm lint)
	$(PNPM) lint

# ---------------------------------------------------------------------------
# Docker (root Dockerfile + docker-compose.yml)
#
# `notploy` (production) and `notploy-dev` (development) both publish the
# dashboard on NOTPLOY_PORT (3000 by default): http://localhost:3000 in both
# modes. They share the port, so only one of them runs at a time — stop the
# other first with `make docker-down`.
# ---------------------------------------------------------------------------
# Both targets accept the inline product flag (self | cloud | console), the
# same way docker-dev does:
#
#   make docker-up self          # build a fresh image + start self-hosted
#   make docker-up -- --console  # build a fresh image + start console
#
# Semantics: an inline product flag means "build a new image", so `docker-up
# <product>` always triggers docker-build (prefixed, full rebuild) before
# starting. A plain `make docker-up` never rebuilds: it restarts the stack
# with the image built previously (PRODUCT_STATE). `make docker-down` only
# removes the containers, the image stays, so the next plain `make docker-up`
# relaunches instantly. Use `make docker-build <product>` to rebuild ignoring
# PRODUCT_STATE.
docker-build: ## Build one image only (add: self | cloud | console | status, NOTPLOY_VERSION=<tag>)
	@echo "==> building product=$(PRODUCT_WORD) flavor=$(NOTPLOY_FLAVOR) image=$(NOTPLOY_IMAGE):$(NOTPLOY_VERSION)"
	$(COMPOSE_ENV) $(COMPOSE) build $(COMPOSE_BUILD_SERVICE)
	@printf '%s\n' '$(PRODUCT_WORD)' > $(PRODUCT_STATE)

docker-up: ## Start the stack (add: self | cloud | console | status to build a fresh image first)
	@echo "==> starting product=$(PRODUCT_WORD) flavor=$(NOTPLOY_FLAVOR) image=$(NOTPLOY_IMAGE):$(NOTPLOY_VERSION)"
	@$(STACK_PREPARE)
	@$(call dns-ports-check,$(CHECK_PORTS_UP))
	$(COMPOSE_ENV) $(COMPOSE) $(COMPOSE_UP_PROFILES) up -d $(COMPOSE_UP_SERVICES)

ifneq ($(GOAL_PRODUCT),)
docker-up: docker-build
endif

# Stops whatever is actually running. Compose only removes the containers of the
# enabled profiles, so the dev profile has to be added as soon as a notploy-dev
# container exists — otherwise `docker compose down` leaves it running and fails
# to release the shared network ("Resource is still in use").
docker-down: ## Stop the running stack, dev containers included (volumes are preserved)
	@if [ -n "$$($(COMPOSE) --profile dev --profile status ps -aq notploy-dev status-dev 2>/dev/null)" ]; then \
		echo "==> dev container found, stopping the whole stack"; \
		$(COMPOSE) --profile dev --profile status down --remove-orphans --timeout 15; \
	else \
		echo "==> no dev container, stopping the production stack"; \
		$(COMPOSE) --profile status down --remove-orphans --timeout 15; \
	fi

docker-restart: ## Restart the stack
	$(COMPOSE_ENV) $(COMPOSE) restart

docker-logs: ## Follow the stack logs
	$(COMPOSE) --profile dev --profile status logs -f

docker-ps: ## Show stack status
	$(COMPOSE) --profile dev --profile status ps -a

docker-config: ## Validate and print the resolved Compose configuration
	$(COMPOSE_ENV) $(COMPOSE) config

# ---------------------------------------------------------------------------
# Status page (Notploy Cloud, API, MCP Server, GitHub App, Website, Docs)
#
# The seed is idempotent: existing components are left untouched, so it is safe
# to re-run. It writes to STATUS_DATA_DIR (default ./data), the same override
# the status services use, e.g.:
#   STATUS_DATA_DIR=/var/lib/notploy-status make status-seed
# ---------------------------------------------------------------------------
ifeq ($(CONTAINER),1)
status-seed: ## Seed the catalog inside the running status container (add CONTAINER=1)
	@echo "==> seeding the catalog inside the running status container"
	$(COMPOSE) --profile status exec status node engine-dist/seed.js $(SEED_ARGS)
else
status-seed: ## Create the Notploy status page and its six components (idempotent)
	@echo "==> seeding the catalog into STATUS_DATA_DIR=$${STATUS_DATA_DIR:-./data}"
	$(PNPM) --filter @notploy/status run seed -- $(SEED_ARGS)
endif

docker-dev: ## Run the containerized dev server with hot reload (add: status for the status page)
	@# Recreate the dev container every run: reusing one whose network endpoint is
	@# stale makes the daemon fail with "Could not attach to network ... not found".
	@$(COMPOSE) $(COMPOSE_DEV_PROFILES) rm -sf $(COMPOSE_DEV_SERVICE) >/dev/null 2>&1 || true
	@$(STACK_PREPARE)
	@$(call dns-ports-check,$(CHECK_PORTS_DEV))
	$(COMPOSE_ENV) $(COMPOSE) $(COMPOSE_DEV_PROFILES) up --build --watch $(COMPOSE_DEV_SERVICE)

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
clean: ## Remove local build artifacts (.next, dist, tsbuildinfo, saved product)
	rm -rf apps/*/.next apps/*/dist packages/*/dist web/*/.next web/*/dist
	find . -name '*.tsbuildinfo' -not -path './node_modules/*' -delete
	rm -f $(PRODUCT_STATE)

# ---------------------------------------------------------------------------
# Production/self-hosted installation targets
# ---------------------------------------------------------------------------
.PHONY: install-production install-server status logs restart start stop update doctor backup uninstall

install-production: ## Install Notploy using Docker Swarm (production-ready, multi-node support)
	@chmod +x scripts/install-production.sh
	@./scripts/install-production.sh

install: ## Install Notploy locally for development/self-hosted (docker compose)
	@chmod +x scripts/make-install-helper.sh
	@./scripts/make-install-helper.sh

# Server management targets for the compose setup
start: ## Start the stack
	@$(COMPOSE_ENV) $(COMPOSE) up -d

stop: ## Stop the stack
	@$(COMPOSE_ENV) $(COMPOSE) down --remove-orphans

restart: ## Restart the stack
	@$(COMPOSE_ENV) $(COMPOSE) restart

status: ## Show stack status
	@$(COMPOSE_ENV) $(COMPOSE) ps

logs: ## Follow logs (optionally: make logs SERVICE=notploy)
	@if [ -n "$(SERVICE)" ]; then \
		$(COMPOSE_ENV) $(COMPOSE) logs -f $(SERVICE); \
	else \
		$(COMPOSE_ENV) $(COMPOSE) logs -f; \
	fi

update: ## Update to latest version (pull and rebuild/restart)
	@git pull
	@$(COMPOSE_ENV) $(COMPOSE) pull
	@$(COMPOSE_ENV) $(COMPOSE) up -d --build

doctor: ## Check installation health
	@echo "Notploy Doctor"
	@echo "==============="
	@echo ""
	@echo "System:"
	@command -v docker >/dev/null 2>&1 && echo "✓ Docker" || echo "✗ Docker missing"
	@docker compose version >/dev/null 2>&1 && echo "✓ Docker Compose" || echo "✗ Docker Compose missing"
	@echo ""
	@echo "Configuration:"
	@test -f .env && echo "✓ .env exists" || echo "✗ .env missing"
	@echo ""
	@echo "Runtime:"
	@docker compose ps 2>&1 | tail -5
	@echo ""
	@echo "Storage:"
	@docker volume ls | grep notploy && echo "✓ Notploy volumes present" || echo "✗ No volumes found"

backup: ## Create backup of data volumes (not implemented yet)
	@echo "Backup functionality - requires tar/rsync"
	@echo "To backup manually:"
	@echo "  docker run --rm -v notploy-postgres-data:/data -v \$PWD:/backup alpine tar czf /backup/postgres-$(shell date +%Y%m%d_%H%M%S).tar.gz -C /data ."

uninstall: ## Remove Notploy (data preserved)
	@chmod +x scripts/cleanup.sh
	@./scripts/cleanup.sh
