#!/bin/sh
# SSH User Management Script
# Handles external authentication for SSH users

# Configuration
SSH_USER="ssh-user"
SSH_HOME="/home/${SSH_USER}"
AUTH_SERVICE_URL="${SSH_AUTH_SERVICE_URL:-http://localhost:8080/api/v1/auth/ssh}"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >&2
}

# Check external authentication
check_external_auth() {
    local username="$1"
    local password="$2"
    
    log "Checking external authentication for user: $username"
    
    # Make request to external authentication service
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\",\"service\":\"ssh\"}" \
        "$AUTH_SERVICE_URL" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ "$response" != "null" ]; then
        # Check if authentication was successful (expects JSON with "success": true)
        success=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2 | tr -d ' "')
        
        if [ "$success" = "true" ]; then
            log "Authentication successful for user: $username"
            return 0
        fi
    fi
    
    log "Authentication failed for user: $username"
    return 1
}

# Fallback to local authentication (if enabled)
check_local_auth() {
    local username="$1"
    local password="$2"
    
    # Only allow local authentication for the ssh-user
    if [ "$username" = "$SSH_USER" ] && [ -n "$SSH_LOCAL_PASSWORD" ]; then
        if [ "$password" = "$SSH_LOCAL_PASSWORD" ]; then
            log "Local authentication successful for user: $username"
            return 0
        fi
    fi
    
    return 1
}

# Main authentication function
authenticate_user() {
    local username="$1"
    local password="$2"
    
    # Try external authentication first
    if [ -n "$AUTH_SERVICE_URL" ]; then
        if check_external_auth "$username" "$password"; then
            return 0
        fi
    fi
    
    # Fallback to local authentication if enabled
    if [ "$SSH_ENABLE_LOCAL_AUTH" = "true" ]; then
        if check_local_auth "$username" "$password"; then
            return 0
        fi
    fi
    
    return 1
}

# If script is called directly, perform authentication test
if [ "$1" = "test" ] && [ -n "$2" ] && [ -n "$3" ]; then
    if authenticate_user "$2" "$3"; then
        echo "AUTH_SUCCESS"
        exit 0
    else
        echo "AUTH_FAILED"
        exit 1
    fi
fi