# Development Environment Setup

## Overview

Le `Dockerfile.dev` crée un environnement de développement qui reproduit fidèlement l'environnement de production avec capacités de hot reload.

## Services Inclus

- **Next.js Frontend** (port 3000) - Hot reload activé
- **Go Backend** (port 8080) - Hot reload avec Air
- **PostgreSQL** (port 5432) - Base de données de développement
- **Redis** (port 6379) - Cache et sessions
- **CLI** - Interface en ligne de commande

## Utilisation

### Démarrage rapide

```bash
# Construire et démarrer l'environnement de développement
docker-compose -f docker-compose.dev.yml up --build

# Démarrer en arrière-plan
docker-compose -f docker-compose.dev.yml up -d --build
```

### Avec interfaces graphiques (optionnel)

```bash
# Inclure pgAdmin et Redis Commander
docker-compose -f docker-compose.dev.yml --profile gui up --build
```

### Arrêter l'environnement

```bash
# Arrêter et supprimer les conteneurs
docker-compose -f docker-compose.dev.yml down

# Arrêter et supprimer les volumes (données)
docker-compose -f docker-compose.dev.yml down -v
```

## Accès aux services

### Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Base de données

- PostgreSQL: localhost:5432
  - Utilisateur: mailer
  - Mot de passe: dev_password
  - Base: aether_mailer_dev

### Redis

- Redis: localhost:6379
  - Mot de passe: dev_redis_password

### Interfaces graphiques (si activé)

- pgAdmin: http://localhost:5050
  - Email: dev@aether-mailer.com
  - Mot de passe: dev_admin
- Redis Commander: http://localhost:8081

## Développement

### Hot reload

- **Frontend**: Modifications dans `app/` automatiquement rechargées
- **Backend**: Modifications dans `server/` automatiquement recompilées avec Air
- **CLI**: Modifications dans `cli/` automatiquement rechargées

### Logs

```bash
# Voir tous les logs
docker-compose -f docker-compose.dev.yml logs -f

# Voir les logs d'un service spécifique
docker-compose -f docker-compose.dev.yml logs -f app-dev
docker-compose -f docker-compose.dev.yml logs -f postgres
```

### Base de données

```bash
# Accéder à la base de données
docker-compose -f docker-compose.dev.yml exec postgres psql -U mailer -d aether_mailer_dev

# Lancer les migrations
docker-compose -f docker-compose.dev.yml exec app-dev pnpm db:migrate

# Lancer Prisma Studio
docker-compose -f docker-compose.dev.yml exec app-dev pnpm db:studio
```

## Configuration

### Variables d'environnement

Les variables de développement sont configurées dans `docker-compose.dev.yml`:

- `NODE_ENV=development`
- `GO_ENV=development`
- `POSTGRES_DB=aether_mailer_dev`
- `POSTGRES_PASSWORD=dev_password`
- `REDIS_PASSWORD=dev_redis_password`

### Volumes montés

- Code source pour hot reload
- Logs pour le débogage
- Données persistantes pour la base de données

## Production vs Développement

### Similitudes

- Mêmes services (Next.js, Go, PostgreSQL, Redis)
- Mêmes ports d'exposition
- Mêmes structures de base de données

### Différences

- **Hot reload**: Activé en développement
- **Build**: Optimisé pour le développement vs production
- **Logs**: Plus verbeux en développement
- **Interfaces GUI**: Disponibles en développement uniquement
- **Volumes**: Code source monté pour modifications temps réel

## Dépannage

### Problèmes courants

1. **Ports déjà utilisés**: Vérifiez que les ports 3000, 8080, 5432, 6379 sont libres
2. **Permissions**: Assurez-vous que Docker a les permissions nécessaires
3. **Build échoué**: Vérifiez les logs d'erreur avec `docker-compose logs`

### Nettoyage complet

```bash
# Arrêter tout et nettoyer
docker-compose -f docker-compose.dev.yml down -v --remove-orphans
docker system prune -f
```
