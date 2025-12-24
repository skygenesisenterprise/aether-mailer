#!/bin/sh
set -e

echo "🚀 Starting Aether Mailer..."
echo "📍 Environment: $NODE_ENV"
echo "🗄️  Database Provider: $DATABASE_PROVIDER"
if [ -n "$DATABASE_URL" ]; then
    echo "🔗 Database URL: $(echo $DATABASE_URL | sed 's|://.*@|://***:***@|')"
fi

#############################################
# Setup Environment Variables
#############################################
setup_env() {
    export POSTGRES_DB=aether_mailer
    export POSTGRES_USER=mailer
    export POSTGRES_HOST=localhost
    export POSTGRES_PORT=5432
    export POSTGRES_PASSWORD=mailer_postgres
    export DATABASE_URL="postgresql://$POSTGRES_USER@localhost:5432/$POSTGRES_DB"

    export SERVER_PORT=8080
    export FRONTEND_PORT=3000
    export NODE_ENV=production

    echo "🔧 Environment configured"
}

#############################################
# Start PostgreSQL
#############################################
start_postgres() {
    if [ "$DATABASE_PROVIDER" = "postgresql" ]; then
        echo "🐘 Starting PostgreSQL on internal port $POSTGRES_PORT..."

        mkdir -p /var/lib/postgresql/data
        chown -R mailer:mailer /var/lib/postgresql/data

        if [ ! -s /var/lib/postgresql/data/PG_VERSION ]; then
            echo "⚡ Initializing PostgreSQL database..."
            initdb -D /var/lib/postgresql/data
        fi

        # Start postgres in background
        postgres -D /var/lib/postgresql/data &
        POSTGRES_PID=$!

        # Wait for postgres to be ready
        MAX_RETRIES=30
        RETRY_COUNT=0
        until pg_isready -h localhost -p "$POSTGRES_PORT" -U "$POSTGRES_USER" > /dev/null 2>&1; do
            RETRY_COUNT=$((RETRY_COUNT + 1))
            echo "⏳ Attempt $RETRY_COUNT/$MAX_RETRIES: PostgreSQL not ready..."
            if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
                echo "❌ PostgreSQL failed to start"
                exit 1
            fi
            sleep 2
        done

        echo "✅ PostgreSQL started successfully"

        # Create database if not exists
        createdb -h localhost -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB" 2>/dev/null || true
    fi
}

#############################################
# Start Go Backend
#############################################
start_backend() {
    echo "🔧 Starting Go backend server on internal port $SERVER_PORT..."
    cd /app
    ./server/main &
    BACKEND_PID=$!
    sleep 3
    kill -0 "$BACKEND_PID" 2>/dev/null || { echo "❌ Backend failed to start"; exit 1; }
    echo "✅ Backend running (PID $BACKEND_PID)"
}

#############################################
# Start Frontend (Next.js + Caddy)
#############################################
start_frontend() {
    echo "🎨 Starting Next.js frontend on internal port 3001..."
    cd /app
    if [ -d "frontend" ]; then
        cd frontend
        NODE_ENV=production PORT=3001 node . &
    else
        NODE_ENV=production PORT=3001 node . &
    fi
    NEXTJS_PID=$!
    sleep 3
    kill -0 "$NEXTJS_PID" 2>/dev/null || { echo "❌ Next.js failed to start"; exit 1; }
    echo "✅ Next.js running on internal port 3001 (PID $NEXTJS_PID)"

    echo "🎨 Starting Caddy reverse proxy on public port $FRONTEND_PORT..."
    cd /app
    caddy run --config Caddyfile &
    FRONTEND_PID=$!
    sleep 3
    kill -0 "$FRONTEND_PID" 2>/dev/null || { echo "❌ Caddy failed to start"; exit 1; }
    echo "✅ Caddy running on public port $FRONTEND_PORT (PID $FRONTEND_PID)"
}

#############################################
# Health Checks
#############################################
health_check() {
    echo "🔍 Performing health checks..."
    pg_isready -h localhost -p "$POSTGRES_PORT" -U "$POSTGRES_USER" && echo "✅ PostgreSQL OK" || return 1
    redis-cli ping && echo "✅ Redis OK" || return 1
    curl -s http://localhost:$SERVER_PORT/health && echo "✅ Backend OK" || return 1
    curl -s http://localhost:$FRONTEND_PORT && echo "✅ Frontend OK" || return 1
    echo "✅ All health checks passed"
}

#############################################
# Cleanup
#############################################
cleanup() {
    echo "🛑 Shutting down services..."
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
    [ -n "$NEXTJS_PID" ] && kill "$NEXTJS_PID" 2>/dev/null || true
    [ -n "$POSTGRES_PID" ] && kill "$POSTGRES_PID" 2>/dev/null || true
    wait || true
    echo "✅ All services stopped"
}

trap cleanup SIGTERM SIGINT

#############################################
# Main
#############################################
echo "🏗️  Architecture Overview:"
echo "  🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo "  🔧 Backend: http://localhost:$SERVER_PORT"
echo "  🐘 PostgreSQL: localhost:$POSTGRES_PORT"
echo ""

setup_env
start_postgres
sleep 5
start_backend
start_frontend
sleep 5
health_check

echo ""
echo "🎉 Aether Mailer is ready!"
echo "Press Ctrl+C to stop all services"

wait
