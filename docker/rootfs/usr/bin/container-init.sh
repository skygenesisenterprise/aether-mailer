#!/bin/sh
# Container system initialization script
# Sets up proper container environment and permissions

set -e

echo "🔧 Initializing Aether Mailer container environment..."

# Load system environment
if [ -f /etc/environment ]; then
    . /etc/environment
    echo "✓ Loaded system environment from /etc/environment"
fi

# Create runtime directories
echo "📁 Creating runtime directories..."
mkdir -p /var/run/sshd
mkdir -p /var/log/mailer
mkdir -p /var/log/sshd
mkdir -p /tmp/aether-mailer

# Set proper permissions
echo "🔒 Setting permissions..."
chmod 755 /var/run
chmod 755 /var/log
chmod 755 /tmp

# Secure critical directories
chmod 700 /root
chmod 755 /home

# Set ownership for log directories
chown -R root:root /var/log
chown -R root:root /var/run

# Set up user home directories if they don't exist
if [ -d /home/ssh-user ]; then
    mkdir -p /home/ssh-user/.ssh
    chmod 700 /home/ssh-user/.ssh
    chown -R ssh-user:ssh-users /home/ssh-user
    echo "✓ SSH user home directory configured"
fi

if [ -d /home/mailer ]; then
    mkdir -p /home/mailer/.config
    chown -R mailer:mailer /home/mailer
    echo "✓ Mailer user home directory configured"
fi

# Initialize PID files
echo "📝 Initializing PID files..."
: > /var/run/sshd.pid
: > /var/run/mailer.pid

# Setup container networking hints
echo "🌐 Setting up container networking..."
if [ -f /etc/hosts ]; then
    # Add container-specific entries if not present
    if ! grep -q "aether-mailer" /etc/hosts; then
        echo "127.0.0.1   aether-mailer mailer" >> /etc/hosts
    fi
fi

# Create symlinks for compatibility
echo "🔗 Creating compatibility symlinks..."
ln -sf /usr/bin/mailer-shell.sh /usr/local/bin/mailer-cli 2>/dev/null || true
ln -sf /usr/bin/ssh-auth.sh /usr/local/bin/ssh-auth 2>/dev/null || true

# Final security hardening
echo "🛡️ Security hardening..."
# Remove setuid binaries that aren't needed in container
find /usr/bin /usr/sbin -perm -4000 -exec rm -f {} \; 2>/dev/null || true

echo "✅ Container initialization completed successfully"