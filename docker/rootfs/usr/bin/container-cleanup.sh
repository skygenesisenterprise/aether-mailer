#!/bin/sh
# Container cleanup script
# Properly shuts down all services in Aether Mailer container

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}🛑 Shutting down Aether Mailer container...${NC}"

# Function to gracefully stop a process
stop_process() {
    local process_name="$1"
    local pid_file="$2"
    local signal="${3:-TERM}"
    
    if [ -n "$pid_file" ] && [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $process_name (PID: $pid)..."
            kill -$signal "$pid"
            
            # Wait for process to stop
            timeout=10
            while [ $timeout -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
                sleep 1
                timeout=$((timeout - 1))
            done
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                echo "Force stopping $process_name..."
                kill -KILL "$pid"
            fi
            
            rm -f "$pid_file"
            echo "${GREEN}✓ $process_name stopped${NC}"
        fi
    else
        # Stop by process name
        pids=$(pgrep -f "$process_name" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "Stopping $process_name..."
            echo "$pids" | xargs kill -$signal 2>/dev/null || true
            
            # Wait and force if needed
            sleep 2
            pids=$(pgrep -f "$process_name" 2>/dev/null || true)
            if [ -n "$pids" ]; then
                echo "Force stopping $process_name..."
                echo "$pids" | xargs kill -KILL 2>/dev/null || true
            fi
            echo "${GREEN}✓ $process_name stopped${NC}"
        fi
    fi
}

# Stop services in reverse order of startup
echo ""
echo "${YELLOW}Stopping services gracefully...${NC}"

# Stop frontend services first
stop_process "node.*next" "/var/run/nextjs.pid"
stop_process "caddy" "/var/run/caddy.pid"

# Stop backend services
stop_process "node.*main.js" "/var/run/backend.pid"

# Stop database (PostgreSQL)
stop_process "postgres" "/var/run/postgresql.pid"

# Stop SSH daemon
stop_process "sshd" "/var/run/sshd.pid"

# Clean up temporary files
echo ""
echo "${YELLOW}Cleaning up temporary files...${NC}"

# Remove PID files
rm -f /var/run/*.pid 2>/dev/null || true
rm -f /tmp/*.sock 2>/dev/null || true

# Clean up temporary directories
if [ -d "/tmp/aether-mailer" ]; then
    rm -rf /tmp/aether-mailer/*
    echo "${GREEN}✓ Temporary files cleaned${NC}"
fi

# Sync filesystem
echo ""
echo "${YELLOW}Syncing filesystem...${NC}"
sync 2>/dev/null || true

# Final log
echo ""
echo "${GREEN}✅ Aether Mailer container shutdown complete${NC}"