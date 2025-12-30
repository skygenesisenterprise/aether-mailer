#!/bin/bash

# Development Docker startup script
# Provides hot reload and development services

set -e

echo "🚀 Starting Aether Mailer Development Environment..."

# Function to check if service is ready
wait_for_service() {
    local service=$1
    local host=$2
    local port=$3
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            echo "✅ $service is ready!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - $service not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $service failed to start within expected time"
    return 1
}

# Function to run database setup
setup_database() {
    echo "🗄️ Setting up database..."
    
    # Wait for PostgreSQL
    wait_for_service "PostgreSQL" postgres 5432
    
    # Run migrations if they exist
    if [ -f "/app/prisma/schema.prisma" ]; then
        echo "📋 Running Prisma migrations..."
        cd /app
        pnpm db:generate || echo "⚠️ Prisma generate failed, continuing..."
        pnpm db:migrate || echo "⚠️ Migration failed, continuing..."
        pnpm db:seed || echo "⚠️ Seeding failed, continuing..."
    fi
}

# Function to start development services
start_services() {
    echo "🔧 Starting development services..."
    
    # Create log directories
    mkdir -p /var/log/app
    
    # Start services in background
    echo "📱 Starting Next.js frontend..."
    cd /app && pnpm --filter app dev > /var/log/app/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    echo "🔧 Starting Go backend with hot reload..."
    cd /server && air > /var/log/app/backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo "⚡ Starting CLI development server..."
    cd /app && pnpm --filter cli dev > /var/log/app/cli.log 2>&1 &
    CLI_PID=$!
    
    # Store PIDs for cleanup
    echo $FRONTEND_PID > /tmp/frontend.pid
    echo $BACKEND_PID > /tmp/backend.pid
    echo $CLI_PID > /tmp/cli.pid
    
    echo "✅ All services started!"
    echo ""
    echo "🌐 Services available at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8080"
    echo "   CLI:      Check logs with: docker logs <container>"
    echo ""
    echo "📋 View logs:"
    echo "   Frontend: docker logs <container> -f | grep frontend"
    echo "   Backend:  docker logs <container> -f | grep backend"
    echo "   CLI:      docker logs <container> -f | grep cli"
}

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    
    if [ -f /tmp/frontend.pid ]; then
        kill $(cat /tmp/frontend.pid) 2>/dev/null || true
    fi
    
    if [ -f /tmp/backend.pid ]; then
        kill $(cat /tmp/backend.pid) 2>/dev/null || true
    fi
    
    if [ -f /tmp/cli.pid ]; then
        kill $(cat /tmp/cli.pid) 2>/dev/null || true
    fi
    
    echo "✅ Cleanup complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo "🔍 Checking dependencies..."
    
    # Wait for Redis
    wait_for_service "Redis" redis 6379
    
    # Setup database
    setup_database
    
    # Start services
    start_services
    
    # Keep container running and monitor services
    echo "🔄 Monitoring services... (Press Ctrl+C to stop)"
    
    while true; do
        # Check if services are still running
        if [ -f /tmp/frontend.pid ] && ! kill -0 $(cat /tmp/frontend.pid) 2>/dev/null; then
            echo "⚠️ Frontend service stopped, restarting..."
            cd /app && pnpm --filter app dev > /var/log/app/frontend.log 2>&1 &
            echo $! > /tmp/frontend.pid
        fi
        
        if [ -f /tmp/backend.pid ] && ! kill -0 $(cat /tmp/backend.pid) 2>/dev/null; then
            echo "⚠️ Backend service stopped, restarting..."
            cd /server && air > /var/log/app/backend.log 2>&1 &
            echo $! > /tmp/backend.pid
        fi
        
        if [ -f /tmp/cli.pid ] && ! kill -0 $(cat /tmp/cli.pid) 2>/dev/null; then
            echo "⚠️ CLI service stopped, restarting..."
            cd /app && pnpm --filter cli dev > /var/log/app/cli.log 2>&1 &
            echo $! > /tmp/cli.pid
        fi
        
        sleep 10
    done
}

# Run main function
main "$@"