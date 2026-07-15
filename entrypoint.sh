#!/bin/sh
set -e

export PATH="/usr/local/go/bin:/go/bin:/root/go/bin:/root/.local/share/corepack:/root/.local/share/corepack/shims:/usr/local/bin:/usr/bin:/bin:${PATH}"
export NODE_ENV="${NODE_ENV:-development}"
export LOG_LEVEL="${LOG_LEVEL:-info}"
export PRISMA_SCHEMA_DEPLOY="${PRISMA_SCHEMA_DEPLOY:-true}"
export PRISMA_DB_PUSH="${PRISMA_DB_PUSH:-false}"
export ALLOW_MIGRATION_FAILURE="${ALLOW_MIGRATION_FAILURE:-true}"

timestamp_utc() {
    date -u '+%Y-%m-%dT%H:%M:%SZ'
}

should_log() {
    requested_level="$1"

    case "${LOG_LEVEL:-info}" in
        debug)
            return 0
            ;;
        info)
            [ "${requested_level}" != "debug" ]
            ;;
        warn)
            [ "${requested_level}" = "warn" ] || [ "${requested_level}" = "error" ]
            ;;
        error)
            [ "${requested_level}" = "error" ]
            ;;
        *)
            return 0
            ;;
    esac
}

log_debug() {
    if should_log debug; then
        echo "[DEBUG] $(timestamp_utc) - $1"
    fi
}

log_info() {
    if should_log info; then
        echo "[INFO] $(timestamp_utc) - $1"
    fi
}

log_warn() {
    if should_log warn; then
        echo "[WARN] $(timestamp_utc) - $1" >&2
    fi
}

log_error() {
    if should_log error; then
        echo "[ERROR] $(timestamp_utc) - $1" >&2
    fi
}

load_env_file() {
    for env_file in /app/.env ./.env /app/.env.example ./.env.example; do
        if [ -f "${env_file}" ]; then
            log_info "Loading environment from ${env_file}"
            while IFS= read -r env_line || [ -n "${env_line}" ]; do
                case "${env_line}" in
                    ""|\#*)
                        continue
                        ;;
                    PG_USER=*)
                        if [ -z "${PG_USER:-}" ]; then export PG_USER="${env_line#PG_USER=}"; fi
                        ;;
                    PG_DB=*)
                        if [ -z "${PG_DB:-}" ]; then export PG_DB="${env_line#PG_DB=}"; fi
                        ;;
                    PG_PASS=*)
                        if [ -z "${PG_PASS:-}" ]; then export PG_PASS="${env_line#PG_PASS=}"; fi
                        ;;
                    PG_HOST=*)
                        if [ -z "${PG_HOST:-}" ]; then export PG_HOST="${env_line#PG_HOST=}"; fi
                        ;;
                    PG_PORT=*)
                        if [ -z "${PG_PORT:-}" ]; then export PG_PORT="${env_line#PG_PORT=}"; fi
                        ;;
                    SECRET_KEY=*)
                        if [ -z "${SECRET_KEY:-}" ]; then export SECRET_KEY="${env_line#SECRET_KEY=}"; fi
                        ;;
                esac
            done < "${env_file}"
            return 0
        fi
    done
}

configure_redis_from_url() {
    if [ -z "${REDIS_URL:-}" ]; then
        return 0
    fi

    redis_url="${REDIS_URL#redis://}"
    redis_url="${redis_url#rediss://}"
    redis_authority="${redis_url%%/*}"
    redis_db="${redis_url#*/}"
    redis_db="${redis_db%%\?*}"

    credentials=""
    redis_host_port="${redis_authority}"
    if [ "${redis_authority#*@}" != "${redis_authority}" ]; then
        credentials="${redis_authority%@*}"
        redis_host_port="${redis_authority#*@}"
    fi

    if [ -n "${credentials}" ]; then
        case "${credentials}" in
            *:*)
                export REDIS_PASSWORD="${credentials#*:}"
                ;;
            *)
                export REDIS_PASSWORD="${credentials}"
                ;;
        esac
    fi

    case "${redis_host_port}" in
        \[*\]:*)
            export REDIS_HOST="${redis_host_port%\]:*}"
            export REDIS_HOST="${REDIS_HOST#\[}"
            export REDIS_PORT="${redis_host_port##*\]:}"
            ;;
        *:*)
            export REDIS_HOST="${redis_host_port%%:*}"
            export REDIS_PORT="${redis_host_port#*:}"
            ;;
        *)
            export REDIS_HOST="${redis_host_port}"
            ;;
    esac

    if [ -n "${redis_db}" ] && [ "${redis_db}" != "${redis_url}" ]; then
        export REDIS_DB="${redis_db}"
    fi
}

configure_database_env() {
    if [ -n "${PG_HOST:-}" ] && [ -z "${DB_HOST:-}" ]; then
        export DB_HOST="${PG_HOST}"
    fi
    if [ -n "${PG_PORT:-}" ] && [ -z "${DB_PORT:-}" ]; then
        export DB_PORT="${PG_PORT}"
    fi
    if [ -n "${PG_USER:-}" ] && [ -z "${DB_USER:-}" ]; then
        export DB_USER="${PG_USER}"
    fi
    if [ -n "${PG_DB:-}" ] && [ -z "${DB_NAME:-}" ]; then
        export DB_NAME="${PG_DB}"
    fi
    if [ -n "${PG_PASS:-}" ] && [ -z "${DB_PASSWORD:-}" ]; then
        export DB_PASSWORD="${PG_PASS}"
    fi
    if [ -n "${POSTGRESQL__HOST:-}" ] && [ -z "${DB_HOST:-}" ]; then
        export DB_HOST="${POSTGRESQL__HOST}"
    fi
    if [ -n "${POSTGRESQL__PORT:-}" ] && [ -z "${DB_PORT:-}" ]; then
        export DB_PORT="${POSTGRESQL__PORT}"
    fi
    if [ -n "${POSTGRESQL__USER:-}" ] && [ -z "${DB_USER:-}" ]; then
        export DB_USER="${POSTGRESQL__USER}"
    fi
    if [ -n "${POSTGRESQL__NAME:-}" ] && [ -z "${DB_NAME:-}" ]; then
        export DB_NAME="${POSTGRESQL__NAME}"
    fi
    if [ -n "${POSTGRESQL__PASSWORD:-}" ] && [ -z "${DB_PASSWORD:-}" ]; then
        export DB_PASSWORD="${POSTGRESQL__PASSWORD}"
    fi
}

configure_runtime() {
    load_env_file
    configure_redis_from_url
    configure_database_env

    if [ -n "${SECRET_KEY:-}" ] && [ -z "${SYSTEM_KEY:-}" ]; then
        export SYSTEM_KEY="${SECRET_KEY}"
    fi

    export USE_EMBEDDED_DB="${USE_EMBEDDED_DB:-false}"
    export FRONTEND_PORT="${FRONTEND_PORT:-3000}"
    export API_PORT="${API_PORT:-8080}"
    export SERVER_PORT="${SERVER_PORT:-${API_PORT}}"
    export DB_HOST="${DB_HOST:-postgresql}"
    export DB_PORT="${DB_PORT:-5432}"
    export DB_USER="${DB_USER:-postgres}"
    export DB_NAME="${DB_NAME:-postgres}"
    export DB_PASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-postgres}}"
    export REDIS_HOST="${REDIS_HOST:-redis}"
    export REDIS_PORT="${REDIS_PORT:-6379}"
    export REDIS_DB="${REDIS_DB:-0}"
    export REDIS_KEY_PREFIX="${REDIS_KEY_PREFIX:-aether-mailer:v1}"
    export REDIS_ENABLED="${REDIS_ENABLED:-true}"
    export REDIS_REQUIRED="${REDIS_REQUIRED:-false}"
    export GIN_MODE="${GIN_MODE:-debug}"
    export HTTP_ACCESS_LOGS="${HTTP_ACCESS_LOGS:-true}"
    export API_ACCESS_LOGS="${API_ACCESS_LOGS:-true}"

    if [ -z "${DATABASE_URL:-}" ]; then
        export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    fi
}

display_header() {
    echo ""
    echo "Aether Mailer development container"
    echo ""
    log_info "Frontend: http://localhost:${FRONTEND_PORT}"
    log_info "API:      http://localhost:${API_PORT}"
    log_info "Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
    log_info "Redis:    ${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}"
    echo ""
}

find_backend_binary() {
    for binary in \
        /app/server/aether-server \
        /app/tmp/aether-server \
        /app/server/aether-mailer
    do
        if [ -x "${binary}" ]; then
            echo "${binary}"
            return 0
        fi
    done

    return 1
}

validate_port() {
    port_name="$1"
    port_value="$2"

    case "${port_value}" in
        ''|*[!0-9]*)
            log_error "${port_name} must be a numeric port value"
            return 1
            ;;
    esac

    if [ "${port_value}" -lt 1 ] || [ "${port_value}" -gt 65535 ]; then
        log_error "${port_name} must be between 1 and 65535"
        return 1
    fi

    return 0
}

setup_pnpm() {
    if command -v pnpm >/dev/null 2>&1; then
        return 0
    fi

    if command -v corepack >/dev/null 2>&1; then
        corepack enable >/dev/null 2>&1 || true
        corepack prepare pnpm@9.15.4 --activate >/dev/null 2>&1 || true
    fi

    if command -v pnpm >/dev/null 2>&1; then
        return 0
    fi

    log_warn "pnpm is not available; falling back to npx where possible"
}

wait_for_database() {
    log_info "Waiting for PostgreSQL..."

    retries=0
    while ! PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c '\q' >/dev/null 2>&1; do
        retries=$((retries + 1))
        if [ "${retries}" -ge 30 ]; then
            log_error "PostgreSQL is not available after ${retries} attempts"
            return 1
        fi
        sleep 2
    done

    log_info "PostgreSQL is ready"
}

log_redis_configuration() {
    if [ "${REDIS_ENABLED:-false}" = "true" ]; then
        log_info "Redis enabled at ${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}"
    else
        log_info "Redis disabled"
    fi
}

find_prisma_dir() {
    for dir in /app/server/prisma ./server/prisma; do
        if [ -f "${dir}/schema.prisma" ]; then
            echo "${dir}"
            return 0
        fi
    done
    return 1
}

find_prisma_bin() {
    for bin in /app/prisma/node_modules/.bin/prisma /app/server/prisma/node_modules/.bin/prisma ./node_modules/.bin/prisma ./server/prisma/node_modules/.bin/prisma; do
        if [ -x "${bin}" ]; then
            echo "${bin}"
            return 0
        fi
    done

    if command -v prisma >/dev/null 2>&1; then
        command -v prisma
        return 0
    fi

    if command -v npx >/dev/null 2>&1; then
        echo "npx prisma"
        return 0
    fi

    return 1
}

run_prisma_schema_deploy() {
    if [ "${PRISMA_SCHEMA_DEPLOY:-true}" != "true" ]; then
        log_info "Prisma schema deployment disabled"
        return 0
    fi

    prisma_dir="$(find_prisma_dir || true)"
    if [ -z "${prisma_dir}" ]; then
        log_warn "server/prisma/schema.prisma not found; skipping database schema setup"
        return 0
    fi

    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL is required to deploy the Prisma schema"
        return 1
    fi

    cd "${prisma_dir}"

    prisma_bin="$(find_prisma_bin || true)"
    if [ -z "${prisma_bin}" ] && [ -f package.json ] && command -v npm >/dev/null 2>&1; then
        log_info "Installing Prisma dependencies..."
        if [ -f package-lock.json ]; then
            npm ci --no-audit --no-fund || return 1
        else
            npm install --no-audit --no-fund || return 1
        fi
        prisma_bin="$(find_prisma_bin || true)"
    fi

    if [ -z "${prisma_bin}" ]; then
        log_error "Prisma CLI is not available"
        return 1
    fi

    log_info "Generating Prisma client..."
    # shellcheck disable=SC2086
    DATABASE_URL="${DATABASE_URL}" ${prisma_bin} generate

    if [ "${PRISMA_DB_PUSH:-false}" != "true" ]; then
        log_info "Prisma db push disabled; leaving database schema ownership to Go migrations"
        return 0
    fi

    log_info "Synchronizing Prisma schema..."
    # shellcheck disable=SC2086
    DATABASE_URL="${DATABASE_URL}" ${prisma_bin} db push --accept-data-loss
}

run_server() {
    configure_runtime
    display_header
    setup_pnpm

    log_info "Aether Mailer frontend starting"
    log_info "Frontend listening on 0.0.0.0:${FRONTEND_PORT}"

    if [ -d /app/apps ]; then
        cd /app/apps
    elif [ -d ./apps ]; then
        cd ./apps
    else
        log_error "Next.js app directory not found at /app/apps or ./apps"
        return 1
    fi
    rm -rf .next/cache 2>/dev/null || true

    if command -v pnpm >/dev/null 2>&1; then
        exec pnpm next dev -p "${FRONTEND_PORT}" -H 0.0.0.0 --turbopack "$@"
    fi

    if command -v npx >/dev/null 2>&1; then
        exec npx next dev -p "${FRONTEND_PORT}" -H 0.0.0.0 --turbopack "$@"
    fi

    log_error "Neither pnpm nor npx is available"
    return 1
}

run_worker() {
    configure_runtime

    log_info "Aether Mailer worker starting"
    log_info "Backend runtime configured for 0.0.0.0:${SERVER_PORT}"

    backend_binary="$(find_backend_binary || true)"
    if [ -z "${backend_binary}" ]; then
        log_error "Go backend binary not found at /app/server/aether-server, /app/tmp/aether-server, or /app/server/aether-mailer"
        return 1
    fi

    wait_for_database
    log_redis_configuration

    if ! run_prisma_schema_deploy; then
        if [ "${ALLOW_MIGRATION_FAILURE}" = "true" ]; then
            log_warn "Prisma schema deployment failed; continuing because ALLOW_MIGRATION_FAILURE=true"
        else
            log_error "Prisma schema deployment failed"
            return 1
        fi
    fi

    log_info "Starting Go backend worker"
    exec "${backend_binary}" worker "$@"
}

run_api() {
    configure_runtime

    log_info "Aether Mailer API starting"

    backend_binary="$(find_backend_binary || true)"
    if [ -z "${backend_binary}" ]; then
        log_error "Go backend binary not found at /app/server/aether-server, /app/tmp/aether-server, or /app/server/aether-mailer"
        return 1
    fi

    wait_for_database
    log_redis_configuration

    if ! run_prisma_schema_deploy; then
        if [ "${ALLOW_MIGRATION_FAILURE}" = "true" ]; then
            log_warn "Prisma schema deployment failed; continuing because ALLOW_MIGRATION_FAILURE=true"
        else
            log_error "Prisma schema deployment failed"
            return 1
        fi
    fi

    log_info "Starting Go backend API"
    exec "${backend_binary}" api "$@"
}

run_scheduler() {
    configure_runtime

    log_info "Aether Mailer scheduler starting"

    backend_binary="$(find_backend_binary || true)"
    if [ -z "${backend_binary}" ]; then
        log_error "Go backend binary not found at /app/server/aether-server, /app/tmp/aether-server, or /app/server/aether-mailer"
        return 1
    fi

    wait_for_database
    log_redis_configuration

    log_info "Starting Go backend scheduler"
    exec "${backend_binary}" scheduler "$@"
}

run_all() {
    configure_runtime

    log_info "Aether Mailer combined runtime starting"

    backend_binary="$(find_backend_binary || true)"
    if [ -z "${backend_binary}" ]; then
        log_error "Go backend binary not found at /app/server/aether-server, /app/tmp/aether-server, or /app/server/aether-mailer"
        return 1
    fi

    wait_for_database
    log_redis_configuration

    if ! run_prisma_schema_deploy; then
        if [ "${ALLOW_MIGRATION_FAILURE}" = "true" ]; then
            log_warn "Prisma schema deployment failed; continuing because ALLOW_MIGRATION_FAILURE=true"
        else
            log_error "Prisma schema deployment failed"
            return 1
        fi
    fi

    log_info "Starting Go backend combined runtime"
    exec "${backend_binary}" all "$@"
}

run_air() {
    configure_runtime

    log_info "Aether Mailer air (hot-reload) starting"

    if ! run_prisma_schema_deploy; then
        if [ "${ALLOW_MIGRATION_FAILURE}" = "true" ]; then
            log_warn "Prisma schema deployment failed; continuing because ALLOW_MIGRATION_FAILURE=true"
        else
            log_error "Prisma schema deployment failed"
            return 1
        fi
    fi

    log_info "Starting air for Go hot-reload"
    cd /app
    exec air "$@"
}

run_mailer() {
    configure_runtime

    log_info "Aether Mailer starting"
    log_info "Backend runtime configured for 0.0.0.0:${SERVER_PORT}"

    backend_binary="$(find_backend_binary || true)"
    if [ -z "${backend_binary}" ]; then
        log_error "Go backend binary not found at /app/server/aether-server, /app/tmp/aether-server, or /app/server/aether-mailer"
        return 1
    fi

    wait_for_database
    log_redis_configuration

    if ! run_prisma_schema_deploy; then
        if [ "${ALLOW_MIGRATION_FAILURE}" = "true" ]; then
            log_warn "Prisma schema deployment failed; continuing because ALLOW_MIGRATION_FAILURE=true"
        else
            log_error "Prisma schema deployment failed"
            return 1
        fi
    fi

    log_info "Starting Go mail server"
    exec "${backend_binary}" server "$@"
}

role="${1:-server}"

case "${role}" in
    server)
        shift || true
        run_server "$@"
        ;;
    api)
        shift || true
        run_api "$@"
        ;;
    worker)
        shift || true
        run_worker "$@"
        ;;
    scheduler)
        shift || true
        run_scheduler "$@"
        ;;
    air)
        shift || true
        run_air "$@"
        ;;
    all)
        shift || true
        run_all "$@"
        ;;
    mailer)
        shift || true
        run_mailer "$@"
        ;;
        *)
        configure_runtime
        exec "$@"
        ;;
esac
