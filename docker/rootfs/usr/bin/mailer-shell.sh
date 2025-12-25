#!/bin/sh
# Aether Mailer CLI Shell
# Custom shell that provides direct access to the mailer CLI

# Set working directory
cd /app

# Display welcome message
echo ""
echo "🚀 Welcome to Aether Mailer CLI!"
echo "📍 Available commands:"
echo "   mailer help        - Show available CLI commands"
echo "   mailer status       - Check server status"
echo "   mailer users list   - List users"
echo "   mailer domains list - List domains"
echo "   mailer health       - Perform health checks"
echo ""
echo "💡 Type 'exit' to disconnect from SSH"
echo ""

# Interactive loop
while true; do
    # Display prompt with username and hostname
    printf "aether-mailer:~\$ "
    
    # Read user input
    read -r input || exit 0
    
    # Handle empty input
    if [ -z "$input" ]; then
        continue
    fi
    
    # Handle exit commands
    case "$input" in
        exit|quit|logout)
            echo "👋 Goodbye!"
            exit 0
            ;;
        help|"?")
            echo "📍 Aether Mailer CLI Help:"
            echo "   mailer <command>    - Execute mailer CLI command"
            echo "   exit, quit, logout  - Disconnect from SSH"
            echo "   help, ?            - Show this help"
            echo ""
            echo "💡 Use 'mailer help' for detailed CLI documentation"
            ;;
        shell|bash|sh)
            echo "❌ Direct shell access is not allowed for security reasons"
            echo "💡 Use 'mailer' commands to manage the system"
            ;;
        *)
            # Execute mailer CLI if input doesn't start with mailer
            if echo "$input" | grep -q "^mailer "; then
                /usr/local/bin/mailer $input 2>/dev/null || echo "❌ Command failed or not found"
            elif echo "$input" | grep -qv "^ "; then
                # If single word without spaces, try as mailer command
                /usr/local/bin/mailer $input 2>/dev/null || echo "❌ Command '$input' not found. Type 'help' for available commands"
            else
                echo "❌ Invalid command. Type 'help' for available commands"
            fi
            ;;
    esac
done