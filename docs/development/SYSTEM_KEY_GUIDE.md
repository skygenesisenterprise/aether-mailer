# Configuration de la Clé Système par Défaut

## 🔑 Clé Système Défaut

Une clé système par défaut a été configurée avec le format suivant :

```
API_KEY_SYSTEM=sk_sys_A1B2C3D4E5F6G7H8
```

## 📋 Caractéristiques

- **Préfixe**: `sk_sys_` (pour identification des clés système)
- **Longueur**: 16 caractères après le préfixe
- **Permissions**: Accès complet à toutes les fonctionnalités
- **Usage**: Réservé uniquement pour les opérations internes du serveur

## 🚨 Sécurité

### ⚠️ IMPORTANT

1. **NE JAMAIS** utiliser cette clé en production
2. **GÉNÉRER** une nouvelle clé système pour chaque environnement
3. **STOCKER** la clé système de manière sécurisée (vault, secrets manager)
4. **LIMITER** l'accès aux serveurs autorisés uniquement

### 🔐 Génération d'une Nouvelle Clé Système

Pour générer une nouvelle clé système sécurisée :

```bash
# Générer 16 bytes aléatoires et encoder en base64
openssl rand -base64 16 | tr -d '=' | head -c 16

# Ou avec Go
go run -c 'package main; import ("crypto/rand"; "encoding/base64"; "fmt"); func main() { b := make([]byte, 16); rand.Read(b); key := base64.URLEncoding.EncodeToString(b); fmt.Printf("sk_sys_%s", key[:16]) }'
```

## 🛠️ Configuration

### Dans `.env`

```bash
# Clé système (remplacer par votre clé sécurisée)
API_KEY_SYSTEM=sk_sys_votre_clé_securisée_ici

# Configuration des clés API
API_KEY_PREFIX=sk_
API_KEY_LENGTH=32
API_KEY_HASH_ROUNDS=12
API_KEY_DEFAULT_TTL=720  # 30 jours
```

### Dans le Code

La clé système est utilisée pour :

1. **Opérations d'administration interne**
2. **Maintenance automatique du système**
3. **Nettoyage des clés expirées**
4. **Monitoring et health checks**
5. **Tâches de fond et batch jobs**

## 🔍 Détection et Validation

Le middleware détecte automatiquement les clés système :

```go
// Dans le middleware ApiKeyMiddleware
if s.config.SystemKey != "" && subtle.ConstantTimeCompare([]byte(apiKey), []byte(s.config.SystemKey)) == 1 {
    // Retourner les permissions complètes pour la clé système
    return &models.ApiKey{
        ID:          "system-key",
        UserID:      "system",
        Name:        "system",
        Permissions: []string{"*"}, // Tous les accès
        IsActive:    true,
        ExpiresAt:   nil, // N'expire jamais
    }, nil
}
```

## 📊 Monitoring

Les utilisations de la clé système sont journalisées avec un niveau de sécurité élevé :

```
WARN API_KEY_USED - System API key used
INFO  - Internal operation completed with system key
```

## 🔄 Rotation de la Clé

Pour faire une rotation sécurisée de la clé système :

1. **Générer** une nouvelle clé système
2. **Mettre à jour** la configuration `API_KEY_SYSTEM`
3. **Redémarrer** le serveur
4. **Vérifier** que tout fonctionne
5. **Révoquer** l'ancienne clé si nécessaire

## 🚀 Déploiement en Production

### Script de Déploiement Suggéré

```bash
#!/bin/bash
# generate-system-key.sh

echo "🔑 Generating secure system API key..."

# Generate secure system key
SYSTEM_KEY=$(openssl rand -base64 16 | tr -d '=' | head -c 16)
SYSTEM_KEY="sk_sys_${SYSTEM_KEY}"

echo "📝 Generated system key: ${SYSTEM_KEY}"
echo "⚠️  Keep this key secure and do not share!"

# Update environment file
echo "API_KEY_SYSTEM=${SYSTEM_KEY}" >> .env

echo "✅ System key added to .env file"
echo "🔄 Please restart the server to apply changes"
```

### Configuration Docker

```dockerfile
# Dans votre Dockerfile ou docker-compose.yml
environment:
  - API_KEY_SYSTEM=${SYSTEM_API_KEY}  # Passer via secrets manager
```

## 📚 Bonnes Pratiques

1. **✅ Utiliser** des variables d'environnement
2. **✅ Chiffrer** les clés au repos
3. **✅ Limiter** l'accès réseau aux serveurs autorisés
4. **✅ Surveiller** les utilisations anormales
5. **✅ Documenter** la rotation et la gestion

---

**Note**: La clé par défaut `sk_sys_A1B2C3D4E5F6G7H8` est fournie uniquement pour le développement et les tests. **NE PAS UTILISER EN PRODUCTION**.
