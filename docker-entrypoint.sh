#!/bin/sh
set -e

echo "🚀 Starting Aether Mailer..."
echo "📍 Environment: $NODE_ENV"
echo "🗄️  Database Provider: $DATABASE_PROVIDER"
echo "🔗 Database URL: $(echo $DATABASE_URL | sed 's|://.*@|://***:***@|')"

#############################################
# Wait for PostgreSQL
#############################################
wait_for_postgres() {
    if [ "$DATABASE_PROVIDER" = "postgresql" ]; then
        echo "⏳ Waiting for PostgreSQL..."
        MAX_RETRIES=${POSTGRES_HEALTH_CHECK_RETRIES:-30}
        RETRY_COUNT=0

        until pg_isready -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" \
                          -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-aether_identity}" > /dev/null 2>&1; do
            RETRY_COUNT=$((RETRY_COUNT + 1))
            echo "⏳ Attempt $RETRY_COUNT/$MAX_RETRIES: PostgreSQL not ready..."
            if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
                echo "❌ PostgreSQL connection failed after $MAX_RETRIES attempts"
                exit 1
            fi
            sleep 2
        done
        echo "✅ PostgreSQL is ready!"
    fi
}

#############################################
# Apply Prisma migrations (backend only)
#############################################
apply_migrations() {
    echo "📦 Applying Prisma migrations..."
    cd /app/backend
    # Assure-toi que Prisma Client est généré
    npx prisma generate --schema prisma/schema.prisma
    npx prisma migrate deploy --schema prisma/schema.prisma
    echo "✅ Migrations applied"
}

#############################################
# Seed initial data if needed
#############################################
seed_data() {
    cd /app/backend
    if [ -f "dist/scripts/seed.js" ]; then
        USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"users\";" 2>/dev/null | tr -d ' ' || echo "0")
        if [ "$USER_COUNT" -eq 0 ]; then
            echo "🌱 Seeding initial data..."
            node dist/scripts/seed.js
            echo "✅ Seeding completed"
        else
            echo "✅ Users already exist, skipping seed"
        fi
    else
        echo "✅ Seed script missing, skipping"
    fi
}

#############################################
# Start backend
#############################################
start_backend() {
    echo "🔧 Starting backend on port ${BACKEND_PORT:-8080}..."
    cd /app/backend
    node dist/server.js &
    BACKEND_PID=$!
    sleep 3
    kill -0 "$BACKEND_PID" 2>/dev/null || { echo "❌ Backend failed to start"; exit 1; }
    echo "✅ Backend running (PID $BACKEND_PID)"
}

#############################################
# Start frontend
#############################################
start_frontend() {
    echo "🎨 Starting frontend on port ${FRONTEND_PORT:-3000}..."
    cd /app/frontend
    # Utiliser NODE_ENV=production pour Next.js
    NODE_ENV=production sh node_modules/.bin/next start -p "${FRONTEND_PORT:-3000}" -H 0.0.0.0 &
    FRONTEND_PID=$!
    sleep 5
    kill -0 "$FRONTEND_PID" 2>/dev/null || { echo "❌ Frontend failed to start"; exit 1; }
    echo "✅ Frontend running (PID $FRONTEND_PID)"
}

#############################################
# Cleanup on exit
#############################################
cleanup() {
    echo "🛑 Shutting down services..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    wait || true
    echo "✅ All services stopped"
}

trap cleanup SIGTERM SIGINT

#############################################
# Main
#############################################
initialize_database() {
    wait_for_postgres
    apply_migrations
    seed_data
}

# Run everything
initialize_database
start_backend
start_frontend

echo ""
echo "📊 Services running:"
echo "  ➜ Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "  ➜ Backend:  http://localhost:${BACKEND_PORT:-8080}"
echo "  ➜ Health:   http://localhost:${BACKEND_PORT:-8080}/health"
echo "  ➜ API Docs: http://localhost:${BACKEND_PORT:-8080}/api/v1/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait