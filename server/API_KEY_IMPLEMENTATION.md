# Système de Gestion des Clés API - Aether Mailer

## 🎯 Objectif

Implémenter un système de gestion des clés API avec préfixe "sk\_" où **TOUTE** requête vers `/api/v1/` doit obligatoirement être accompagnée d'une clé API valide pour la protection contre-espionnage.

## 🏗️ Architecture Implémentée

### 1. **Middleware ApiKeyMiddleware** ✅

**Fichier**: `/src/middleware/apikey.go`

- Validation obligatoire du préfixe "sk\_"
- Support des headers: `Authorization: Bearer sk_...` et `X-API-Key: sk_...`
- Validation en base de données avec hash bcrypt
- Mise à jour automatique du `LastUsedAt`
- Logs des événements de sécurité
- Support de la clé système interne

### 2. **Service ApiKeyService** ✅

**Fichier**: `/src/services/apikey.go`

- Génération sécurisée de clés avec format `sk_<random>`
- Hashage avec bcrypt (configurable)
- Gestion du cycle de vie des clés
- Support de la clé système
- Nettoyage automatique des clés expirées
- Statistiques d'utilisation

### 3. **Controller ApiKeyController** ✅

**Fichier**: `/src/controllers/apikey.go`

- CRUD complet des clés API
- Validation de clés (endpoint debug)
- Statistiques d'utilisation
- Fonctionnalités système (cleanup)

### 4. **Routes ApiKeyRoutes** ✅

**Fichier**: `/src/routes/apikey.go`

- Routes de gestion des clés
- Routes système (protégées)
- Routes de debug (admin only)
- Documentation intégrée

### 5. **Configuration Étendue** ✅

**Fichier**: `/src/config/database.go`

- `APIKeyConfig` avec tous les paramètres
- Variables d'environnement
- Configuration de la clé système

### 6. **Intégration Serveur** ✅

**Fichier**: `/cmd/server/main.go`

- Middleware API key appliqué GLOBALEMENT sur `/api/v1/`
- Initialisation automatique de la clé système
- Support des headers API key dans CORS

### 7. **Modèles de Données** ✅

**Fichier**: `/src/models/auth.go`

- Extensions des modèles existants
- Statistiques d'utilisation
- Requests/Responses structurées

## 🔧 Fonctionnalités Clés

### Validation Obligatoire

```go
// Dans cmd/server/main.go
v1 := s.router.Group("/api/v1")
v1.Use(s.apiKeyMiddleware.ValidateAPIKey()) // <- OBLIGATOIRE
```

### Format des Clés

- **Production**: `sk_live_<32+ chars random>`
- **Test**: `sk_test_<32+ chars random>`
- **Système**: `sk_sys_<32+ chars random>`

### Endpoints Disponibles

#### Gestion des Clés

- `POST /api/v1/api-keys` - Créer une clé
- `GET /api/v1/api-keys` - Lister les clés
- `GET /api/v1/api-keys/:id` - Détails d'une clé
- `PUT /api/v1/api-keys/:id` - Mettre à jour une clé
- `DELETE /api/v1/api-keys/:id` - Révoquer une clé
- `GET /api/v1/api-keys/:id/stats` - Statistiques

#### Système

- `GET /api/v1/system/api-keys/info` - Info clé système
- `POST /api/v1/system/api-keys/cleanup` - Nettoyer clés expirées

#### Debug

- `POST /api/v1/debug/api-keys/validate` - Valider une clé

### Configuration

#### Variables d'Environnement

```bash
API_KEY_PREFIX="sk_"
API_KEY_LENGTH=32
API_KEY_HASH_ROUNDS=12
API_KEY_DEFAULT_TTL=720  # 30 jours en heures
API_KEY_SYSTEM="sk_sys_A1B2C3D4E5F6G7H8"  # Clé système par défaut
```

#### Clé Système par Défaut

- **Format**: `sk_sys_<16 caractères>`
- **Défaut**: `sk_sys_A1B2C3D4E5F6G7H8`
- **Usage**: Opérations internes du serveur uniquement
- **Sécurité**: À remplacer en production

Voir `SYSTEM_KEY_GUIDE.md` pour plus de détails sur la gestion sécurisée des clés système.

#### Permissions

- `email:read`, `email:write`, `email:send`
- `domain:read`, `domain:write`
- `user:read`, `user:write`
- `admin` (accès complet)
- `*` (toutes permissions - clé système seulement)

### Sécurité

#### Authentification

- **Obligatoire** sur tout `/api/v1/`
- Préfixe "sk\_" requis
- Hashage bcrypt avec rounds configurables
- Validation en base de données

#### Autorisation

- Permissions granulaires par clé
- Support de la clé système interne
- Middleware de permission requis

#### Monitoring

- Logs détaillés des tentatives d'accès
- Tracking des utilisations par clé
- Événements de sécurité
- Statistiques d'utilisation

## 🚀 Déploiement

### 1. Configuration Initiale

```bash
export API_KEY_SYSTEM="sk_live_your_system_key_here"
# ou laisser vide pour génération automatique
```

### 2. Démarrage

```bash
cd server
go run cmd/server/main.go
```

### 3. Création Première Clé

```bash
curl -X POST http://localhost:8080/api/v1/api-keys \
  -H "X-API-Key: sk_live_your_system_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Key",
    "permissions": ["email:read", "email:write"]
  }'
```

### 4. Utilisation

```bash
curl http://localhost:8080/api/v1/health \
  -H "Authorization: Bearer sk_live_xxxxxx"
# ou
curl http://localhost:8080/api/v1/health \
  -H "X-API-Key: sk_live_xxxxxx"
```

## 📊 Monitoring

### Logs au Démarrage

```
🔑 System API key initialized successfully
⚠️  SYSTEM API KEY - KEEP SECRET AND SECURE: sk_live_sys_xxxxxx
🔧 Ready to serve requests...
```

### Logs de Sécurité

```
WARN API_KEY_MISSING - API key required but not provided
WARN API_KEY_INVALID_PREFIX - API key with 'sk_' prefix required
WARN API_KEY_INVALID - Invalid API key provided
```

## 🔒 Bonnes Pratiques

1. **Sécurité**
   - Jamais exposer les clés API dans le frontend
   - Utiliser HTTPS systématiquement
   - Faire rotation régulière des clés

2. **Permissions**
   - Principe du moindre privilège
   - Permissions spécifiques par cas d'usage
   - Audit régulier des permissions

3. **Monitoring**
   - Surveillance des utilisations anormales
   - Révocation immédiate des clés compromises
   - Nettoyage régulier des clés expirées

## 🚨 Notes importantes

1. **Breaking Change**: Toutes les requêtes vers `/api/v1/` nécessitent maintenant une clé API
2. **Clé Système**: Générée automatiquement si non fournie via `API_KEY_SYSTEM`
3. **Migration**: Les clients existants doivent être mis à jour avec des clés API
4. **Performance**: Validation en base de données à chaque requête (optimisable avec cache)

## 📈 Évolutions Futures

1. **Cache Redis** pour les validations de clés
2. **Rate limiting** par clé API
3. **Rotation automatique** des clés
4. **Dashboard** de monitoring
5. **Audit trail** complet des utilisations

---

**Implémentation complète et testée ✅**
