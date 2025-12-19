#!/bin/bash

# Aether Mailer Frontend Development Script
# Démarrage direct avec contournement de la structure Next.js

echo "🚀 Aether Mailer - Démarrage direct depuis app/..."

# Variables d'environnement
export NODE_ENV=${NODE_ENV:-development}
export PORT=${PORT:-3000}
export NEXT_TELEMETRY_DISABLED=1

echo "📍 Configuration:"
echo "  - Répertoire: $(pwd)"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: $PORT"
echo ""

# Installation des dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    pnpm install
fi

# Nettoyage
echo "🧹 Nettoyage..."
rm -rf .next

echo "🔧 Démarrage de Next.js (mode direct)..."
echo "🌐 Accès: http://localhost:$PORT"
echo ""

# Démarrage direct en contournant la vérification de structure
node_modules/.bin/next dev --port "$PORT" --hostname 0.0.0.0