#!/bin/bash
set -e

# Uninstall helper
echo "This will remove Notploy containers and networks."
echo "Persistent volumes (postgres data, config) will NOT be removed unless specified."
echo ""
read -p "Continue? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose down --remove-orphans
    echo "Application removed. Data volumes preserved."
    echo "To remove data volumes, run: docker volume rm notploy-postgres-data notploy-config notploy-docker"
fi
