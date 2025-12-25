#!/bin/sh
set -e

echo "🚀 Starting Aether Mailer..."
echo "📍 Environment: $NODE_ENV"
echo "🗄️  Database Provider: $DATABASE_PROVIDER"
echo "🔐 SSH Port: $SSH_PORT"
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
    export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-mailer_postgres}
    export DATABASE_URL="postgresql://$POSTGRES_USER@localhost:5432/$POSTGRES_DB"

    export SERVER_PORT=8080
    export FRONTEND_PORT=3000
    export NODE_ENV=production
    export SSH_AUTH_SERVICE_URL=${SSH_AUTH_SERVICE_URL:-""}
    export SSH_ENABLE_LOCAL_AUTH=${SSH_ENABLE_LOCAL_AUTH:-true}
    
    # Determine frontend HOST based on environment
    if [ "$NODE_ENV" = "development" ] || [ -n "$LOCAL_ACCESS" ]; then
        export HOST=0.0.0.0  # Allow both localhost and domain access in dev
        echo "🔧 Frontend configured for dual access (localhost + domain)"
    else
        export HOST=0.0.0.0  # Bind to all interfaces for domain access
        echo "🔧 Frontend configured for domain access"
    fi

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
#############################################
# Start SSH Server
#############################################
start_ssh() {
    echo "🔐 Starting SSH server on port $SSH_PORT..."
    
    # Ensure proper permissions
    mkdir -p /var/run/sshd
    chmod 0755 /var/run/sshd
    
    # Generate SSH host keys if they don't exist
    if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
        echo "🔑 Generating SSH host keys..."
        ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key -N "" > /dev/null 2>&1
        ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N "" > /dev/null 2>&1
    fi
    
    # Start SSH daemon
    /usr/sbin/sshd -D &
    SSH_PID=$!
    sleep 2
    kill -0 "$SSH_PID" 2>/dev/null || { echo "❌ SSH server failed to start"; exit 1; }
    echo "✅ SSH server running on port $SSH_PORT (PID $SSH_PID)"
}

#############################################
# Start Frontend
#############################################
start_frontend() {
    echo "🎨 Starting Next.js frontend with npm run start..."
    cd /app
    if [ -d "frontend" ]; then
        cd frontend
        # Use npm run start with HOST=0.0.0.0 for public access
        NODE_ENV=production HOST=$HOST PORT=3001 npm run start &
    else
        # Use npm run start with HOST=0.0.0.0 for public access
        NODE_ENV=production HOST=$HOST PORT=3001 npm run start &
    fi
    NEXTJS_PID=$!
    sleep 3
    kill -0 "$NEXTJS_PID" 2>/dev/null || { echo "❌ Next.js failed to start"; exit 1; }
    echo "✅ Next.js running with HOST=$HOST on port 3001 (PID $NEXTJS_PID)"

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
    curl -s http://localhost:$SERVER_PORT/health && echo "✅ Backend OK" || return 1
    curl -s http://localhost:$FRONTEND_PORT && echo "✅ Frontend OK" || return 1
    # Check SSH service
    if [ -n "$SSH_PID" ] && kill -0 "$SSH_PID" 2>/dev/null; then
        echo "✅ SSH server OK"
    else
        echo "❌ SSH server not responding"
        return 1
    fi
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
    [ -n "$SSH_PID" ] && kill "$SSH_PID" 2>/dev/null || true
    wait || true
    echo "✅ All services stopped"
}

trap cleanup SIGTERM SIGINT

#############################################
# Main
#############################################
echo "🏗️  Architecture Overview:"
if [ "$NODE_ENV" = "development" ] || [ -n "$LOCAL_ACCESS" ]; then
    echo "  🌐 Frontend: http://localhost:$FRONTEND_PORT (local development)"
    echo "  🌐 Frontend: http://mailer.skygenesisenterprise.com:$FRONTEND_PORT (domain access)"
else
    echo "  🌐 Frontend: http://0.0.0.0:$FRONTEND_PORT (domain access)"
fi
echo "  🔧 Backend: http://localhost:$SERVER_PORT"
echo "  🐘 PostgreSQL: localhost:$POSTGRES_PORT"
echo "  🔐 SSH: ssh ssh-user@localhost -p $SSH_PORT"
echo ""

setup_env
start_postgres
sleep 5
start_backend
start_ssh
start_frontend
sleep 5
health_check

echo ""
echo "🎉 Aether Mailer is ready!"
echo "🌐 Frontend accessible:"
if [ "$NODE_ENV" = "development" ] || [ -n "$LOCAL_ACCESS" ]; then
    echo "    - Local: http://localhost:$FRONTEND_PORT"
    echo "    - Domain: http://mailer.skygenesisenterprise.com:$FRONTEND_PORT"
else
    echo "    - Domain: http://mailer.skygenesisenterprise.com:$FRONTEND_PORT"
fi
echo "🔐 SSH Access: ssh ssh-user@localhost -p $SSH_PORT"
echo "Press Ctrl+C to stop all services"

wait
