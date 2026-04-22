# Aether Mailer Platform Roadmap

## Vue d'ensemble

Ce document présente la roadmap technique de la plateforme Aether Mailer, couvrant les routes API `/api/v1/*` et leur mapping vers les sections du dashboard.

---

## Structure du Dashboard

Le dashboard est organisé en **14 sections principales** avec **30 pages**:

| Section | Description | Pages |
|---------|-------------|-------|
| `account/` | Sécurité et authentification | app-passwords, crypto, mfa, password |
| `directory/` | Gestion utilisateurs/org | accounts, api-keys, domains, groups, lists, oauth-clients, roles, tenants |
| `forgot/` | Récupération mot de passe | page principale |
| `history/` | Historique emails | delivery, received |
| `manage/` | Gestion système | logs, tracing, tracing/live |
| `network/` | Configuration réseau | page principale |
| `overview/` | Vue d'ensemble | page principale |
| `performance/` | Métriques performance | page principale |
| `queues/` | Gestion files d'attente | messages, reports |
| `reports/` | Rapports sécurité | arf, dmarc, tls |
| `security/` | Paramètres sécurité | page principale |
| `settings/` | Paramètres généraux | page principale |
| `spam/` | Filtres anti-spam | test, train |
| `troubleshoot/` | Outils diagnostic | delivery, dmarc |

---

## Routes API `/api/v1/*`

### Authentification (`/api/v1/auth/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/auth/login` | Connexion utilisateur |
| POST | `/api/v1/auth/register` | Inscription |
| POST | `/api/v1/auth/logout` | Déconnexion |
| POST | `/api/v1/auth/refresh` | Rafraîchir le token |
| POST | `/api/v1/auth/change-password` | Changer le mot de passe |
| POST | `/api/v1/auth/reset-password` | Réinitialiser le mot de passe |
| GET | `/api/v1/account/me` | Informations compte connecté |

**Dashboard:** `/dashboard/account/password/`, `/dashboard/forgot/`

---

### Profil (`/api/v1/profile/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/profile/` | Récupérer le profil |
| PUT | `/api/v1/profile/` | Mettre à jour le profil |
| POST | `/api/v1/profile/avatar` | Upload avatar |

**Dashboard:** `/dashboard/settings/`

---

### Mots de passe applicatifs (`/api/v1/passwords/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/passwords/` | Liste des mots de passe |
| GET | `/api/v1/passwords/{id}` | Détails d'un mot de passe |
| POST | `/api/v1/passwords/` | Créer un mot de passe |
| PUT | `/api/v1/passwords/{id}` | Mettre à jour |
| DELETE | `/api/v1/passwords/{id}` | Supprimer |

**Dashboard:** `/dashboard/account/app-passwords/`

---

### Sécurité (`/api/v1/security/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/security/` | Informations sécurité |
| GET | `/api/v1/security/devices` | Liste des appareils |
| GET | `/api/v1/security/sessions` | Liste des sessions |
| GET | `/api/v1/security/activities` | Activités récentes |
| POST | `/api/v1/security/devices/{id}/trust` | Confier un appareil |
| DELETE | `/api/v1/security/devices/{id}` | Révoquer un appareil |
| DELETE | `/api/v1/security/sessions/{id}` | Révoquer une session |
| POST | `/api/v1/security/2fa/enable` | Activer 2FA |
| POST | `/api/v1/security/2fa/disable` | Désactiver 2FA |
| POST | `/api/v1/security/2fa/verify` | Vérifier 2FA |

#### MFA (`/api/v1/security/mfa/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/security/mfa/methods` | Méthodes MFA disponibles |
| GET | `/api/v1/security/mfa/methods/{id}` | Détails d'une méthode |
| PATCH | `/api/v1/security/mfa/methods/{id}` | Modifier une méthode |
| GET | `/api/v1/security/mfa/policies` | Politiques MFA |
| POST | `/api/v1/security/mfa/policies` | Créer une politique |
| PATCH | `/api/v1/security/mfa/policies/{id}` | Modifier une politique |
| DELETE | `/api/v1/security/mfa/policies/{id}` | Supprimer une politique |
| GET | `/api/v1/security/mfa/stats` | Statistiques MFA |
| GET | `/api/v1/security/mfa/activity` | Activité MFA |

**Dashboard:** `/dashboard/account/mfa/`, `/dashboard/security/`

#### Attack Protection (`/api/v1/security/attack-protection/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/security/attack-protection` | Configuration globale |
| PATCH | `/api/v1/security/attack-protection` | Mettre à jour |
| GET | `/api/v1/security/attack-protection/brute-force` | Paramètres brute-force |
| PATCH | `/api/v1/security/attack-protection/brute-force` | Modifier brute-force |
| GET | `/api/v1/security/attack-protection/breached-passwords` | Mots de passe compromis |
| PATCH | `/api/v1/security/attack-protection/breached-passwords` | Modifier paramètres |

**Dashboard:** `/dashboard/security/`

#### Analytics (`/api/v1/security/analytics/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/security/analytics` | Analytique sécurité |
| GET | `/api/v1/security/analytics/threats` | Menaces détectées |
| GET | `/api/v1/security/monitoring` | Monitoring sécurité |

**Dashboard:** `/dashboard/security/`, `/dashboard/reports/`

---

### Connexions (`/api/v1/connections/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/connections` | Liste des connexions |
| GET | `/api/v1/connections/{id}` | Détails d'une connexion |
| POST | `/api/v1/connections` | Créer une connexion |
| PATCH | `/api/v1/connections/{id}` | Modifier |
| DELETE | `/api/v1/connections/{id}` | Supprimer |
| POST | `/api/v1/connections/{id}/enable` | Activer |
| POST | `/api/v1/connections/{id}/disable` | Désactiver |

#### Database (`/api/v1/connections/database/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/connections/database` | Liste connexions BDD |
| POST | `/api/v1/connections/database` | Créer |
| PATCH | `/api/v1/connections/database/{id}` | Modifier |

#### Social (`/api/v1/connections/social/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/connections/social` | Liste connexions sociales |
| POST | `/api/v1/connections/social` | Créer |

#### Enterprise (`/api/v1/connections/enterprise/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/connections/enterprise` | Liste connexions entreprise |
| POST | `/api/v1/connections/enterprise/saml` | Créer SAML |
| POST | `/api/v1/connections/enterprise/oidc` | Créer OIDC |
| POST | `/api/v1/connections/enterprise/ad` | Créer AD |

#### Passwordless (`/api/v1/connections/passwordless/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/connections/passwordless` | Liste passwordless |
| POST | `/api/v1/connections/passwordless` | Créer |

#### Authentication Profiles (`/api/v1/connections/authentication-profiles/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/connections/authentication-profiles` | Liste profils |
| POST | `/api/v1/connections/authentication-profiles` | Créer |

**Dashboard:** `/dashboard/directory/`, `/dashboard/security/`

---

### Utilisateurs (`/api/v1/users/*`, `/api/v1/admin/users/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/admin/users` | Liste utilisateurs (paginé) |
| GET | `/api/v1/users/{id}` | Détails utilisateur |
| GET | `/api/v1/admin/users/{id}` | Détails admin |
| POST | `/api/v1/users` | Créer utilisateur |
| PATCH | `/api/v1/users/{id}` | Modifier |
| DELETE | `/api/v1/users/{id}` | Supprimer |
| POST | `/api/v1/users/{id}/block` | Bloquer |
| POST | `/api/v1/users/{id}/unblock` | Débloquer |
| POST | `/api/v1/users/{id}/reset-password` | Reset mot de passe |
| POST | `/api/v1/users/{id}/send-email` | Envoyer email |
| POST | `/api/v1/users/{id}/force-logout` | Forcer déconnexion |

**Dashboard:** `/dashboard/directory/accounts/`, `/dashboard/directory/roles/`

---

### Applications (`/api/v1/applications/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/applications` | Liste applications |
| GET | `/api/v1/applications/{id}` | Détails |
| POST | `/api/v1/applications` | Créer |
| PATCH | `/api/v1/applications/{id}` | Modifier |
| DELETE | `/api/v1/applications/{id}` | Supprimer |
| GET | `/api/v1/applications/{id}/credentials` | Credentials |
| POST | `/api/v1/applications/{id}/rotate-secret` | Rotation secret |
| GET | `/api/v1/applications/{id}/stats` | Statistiques |

**Dashboard:** `/dashboard/directory/oauth-clients/`, `/dashboard/directory/api-keys/`

---

### Organisations (`/api/v1/organizations/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/organizations` | Liste organisations |
| GET | `/api/v1/organizations/{id}` | Détails |
| POST | `/api/v1/organizations` | Créer |
| PATCH | `/api/v1/organizations/{id}` | Modifier |
| DELETE | `/api/v1/organizations/{id}` | Supprimer |
| GET | `/api/v1/organizations/{id}/members` | Liste membres |
| POST | `/api/v1/organizations/{id}/members` | Ajouter membre |
| DELETE | `/api/v1/organizations/{id}/members/{userId}` | Retirer membre |
| PATCH | `/api/v1/organizations/{id}/members/{userId}` | Modifier rôle |

**Dashboard:** `/dashboard/directory/tenants/`

---

### Contacts (`/api/v1/contacts/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/contacts/` | Liste contacts (paginé) |
| GET | `/api/v1/contacts/{id}` | Détails contact |
| POST | `/api/v1/contacts/` | Créer contact |
| PUT | `/api/v1/contacts/{id}` | Modifier |
| DELETE | `/api/v1/contacts/{id}` | Supprimer |
| GET | `/api/v1/contacts/groups` | Liste groupes |
| POST | `/api/v1/contacts/groups` | Créer groupe |

**Dashboard:** `/dashboard/directory/groups/`, `/dashboard/directory/lists/`

---

### Domaines (`/api/v1/branding/custom-domains/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/branding/custom-domains` | Liste domaines |
| POST | `/api/v1/branding/custom-domains` | Ajouter domaine |
| PATCH | `/api/v1/branding/custom-domains/{id}` | Modifier |
| DELETE | `/api/v1/branding/custom-domains/{id}` | Supprimer |
| POST | `/api/v1/branding/custom-domains/{id}/verify` | Vérifier |

**Dashboard:** `/dashboard/directory/domains/`, `/dashboard/network/`

---

### Branding (`/api/v1/branding/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/branding/universal-login` | Config login universel |
| PATCH | `/api/v1/branding/universal-login` | Modifier |
| GET | `/api/v1/branding/universal-login/pages` | Pages login |
| POST | `/api/v1/branding/universal-login/pages` | Créer page |
| PATCH | `/api/v1/branding/universal-login/pages/{id}` | Modifier page |
| GET | `/api/v1/branding/custom-login` | Config login custom |
| PATCH | `/api/v1/branding/custom-login` | Modifier |
| GET | `/api/v1/branding/templates` | Liste templates |
| POST | `/api/v1/branding/templates` | Créer template |
| PATCH | `/api/v1/branding/templates/{id}` | Modifier |
| DELETE | `/api/v1/branding/templates/{id}` | Supprimer |

**Dashboard:** `/dashboard/settings/`

---

### Logs (`/api/v1/logs/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/logs` | Liste logs (paginé, filtré) |
| GET | `/api/v1/logs/{id}` | Détails log |
| GET | `/api/v1/logs/stats` | Statistiques logs |
| GET | `/api/v1/logs/export` | Exporter logs |
| GET | `/api/v1/logs/stream` | Stream logs temps réel |

#### Action Logs (`/api/v1/logs/actions/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/logs/actions` | Liste action logs |
| GET | `/api/v1/logs/actions/{id}` | Détails |
| GET | `/api/v1/logs/actions/stats` | Statistiques |

**Dashboard:** `/dashboard/manage/logs/`, `/dashboard/reports/`

---

### Monitoring (`/api/v1/monitoring/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/monitoring/status` | Statut système |
| GET | `/api/v1/monitoring/health` | Santé système |

**Dashboard:** `/dashboard/overview/`, `/dashboard/performance/`

---

### Activity & Stats (`/api/v1/activity/*`, `/api/v1/stats/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/activity` | Activité globale |
| GET | `/api/v1/activity/dau` | Utilisateurs actifs quotidiens |
| GET | `/api/v1/activity/retention` | Rétention |
| GET | `/api/v1/activity/signups` | Inscriptions |
| GET | `/api/v1/stats` | Statistiques globales |
| GET | `/api/v1/stats/users` | Stats utilisateurs |
| GET | `/api/v1/stats/sessions` | Stats sessions |

**Dashboard:** `/dashboard/overview/`, `/dashboard/performance/`

---

### Events (`/api/v1/events/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/events` | Liste événements |
| GET | `/api/v1/events/{id}` | Détails événement |
| GET | `/api/v1/events/stats` | Statistiques |

**Dashboard:** `/dashboard/history/delivery/`, `/dashboard/history/received/`

---

### Marketplace (`/api/v1/marketplace/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/marketplace` | Liste extensions |
| GET | `/api/v1/marketplace/{id}` | Détails extension |
| POST | `/api/v1/marketplace/{id}/install` | Installer |
| POST | `/api/v1/marketplace/{id}/uninstall` | Désinstaller |
| GET | `/api/v1/marketplace/installed` | Extensions installées |
| GET | `/api/v1/marketplace/trending` | Extensions tendances |

**Dashboard:** `/dashboard/manage/`

---

### Third-party (`/api/v1/third-party/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/third-party/` | Liste applications connectées |
| POST | `/api/v1/third-party/` | Connecter application |
| DELETE | `/api/v1/third-party/{id}` | Révoquer |

**Dashboard:** `/dashboard/settings/`

---

### Privacy (`/api/v1/privacy/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/privacy/` | Paramètres vie privée |
| PUT | `/api/v1/privacy/` | Modifier paramètres |
| POST | `/api/v1/privacy/export` | Exporter données |
| POST | `/api/v1/privacy/delete` | Supprimer compte |

**Dashboard:** `/dashboard/settings/`

---

### Actions & Extensions (`/api/v1/actions/*`, `/api/v1/extensions/*`)

#### Actions (`/api/v1/actions/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/actions` | Liste actions |
| GET | `/api/v1/actions/{id}` | Détails |
| POST | `/api/v1/actions` | Créer action |
| PATCH | `/api/v1/actions/{id}` | Modifier |
| DELETE | `/api/v1/actions/{id}` | Supprimer |
| POST | `/api/v1/actions/{id}/deploy` | Déployer |
| POST | `/api/v1/actions/{id}/test` | Tester |
| GET | `/api/v1/actions/library` | Bibliothèque templates |
| GET | `/api/v1/actions/triggers` | Triggers disponibles |
| GET | `/api/v1/actions/triggers/mappings` | Mappings triggers |
| GET | `/api/v1/actions/triggers/events` | Événements triggers |

#### Forms (`/api/v1/actions/forms/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/actions/forms` | Liste formulaires |
| GET | `/api/v1/actions/forms/{id}` | Détails |
| POST | `/api/v1/actions/forms` | Créer |
| PATCH | `/api/v1/actions/forms/{id}` | Modifier |
| DELETE | `/api/v1/actions/forms/{id}` | Supprimer |
| GET | `/api/v1/actions/forms/templates` | Templates |

#### Extensions (`/api/v1/extensions/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/extensions` | Liste extensions |
| GET | `/api/v1/extensions/{id}` | Détails |
| POST | `/api/v1/extensions` | Créer |
| PATCH | `/api/v1/extensions/{id}` | Modifier |
| DELETE | `/api/v1/extensions/{id}` | Supprimer |
| GET | `/api/v1/extensions/{id}/config` | Configuration |
| PATCH | `/api/v1/extensions/{id}/config` | Modifier config |
| GET | `/api/v1/extensions/marketplace` | Extensions disponibles |

**Dashboard:** `/dashboard/manage/`, `/dashboard/troubleshoot/`

---

### Agents (`/api/v1/agents/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/agents` | Liste agents |
| GET | `/api/v1/agents/{id}` | Détails |
| POST | `/api/v1/agents` | Créer agent |
| PATCH | `/api/v1/agents/{id}` | Modifier |
| DELETE | `/api/v1/agents/{id}` | Supprimer |
| GET | `/api/v1/agents/{id}/status` | Statut |
| POST | `/api/v1/agents/{id}/restart` | Redémarrer |

**Dashboard:** `/dashboard/manage/`, `/dashboard/performance/`

---

### Queues (`/api/v1/queues/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/queues/messages` | Messages en file |
| GET | `/api/v1/queues/reports` | Rapports queues |

**Dashboard:** `/dashboard/queues/messages/`, `/dashboard/queues/reports/`

---

### Spam & DMARC (`/api/v1/spam/*`, `/api/v1/dmarc/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/reports/dmarc` | Rapports DMARC |
| GET | `/api/v1/reports/arf` | Rapports ARF |
| GET | `/api/v1/reports/tls` | Rapports TLS |

**Dashboard:** `/dashboard/spam/test/`, `/dashboard/spam/train/`, `/dashboard/reports/dmarc/`, `/dashboard/reports/tls/`

---

### Footer Links (`/api/v1/footer-links/*`, `/api/v1/admin/footer-links/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/footer-links` | Liste liens footer |
| POST | `/api/v1/admin/footer-links` | Créer lien |
| PUT | `/api/v1/admin/footer-links/{id}` | Modifier |
| DELETE | `/api/v1/admin/footer-links/{id}` | Supprimer |

**Dashboard:** `/dashboard/settings/`

---

### Etheria CMS (`/api/v1/articles/*`, `/api/v1/categories/*`, `/api/v1/comments/*`, etc.)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/articles` | Liste articles |
| GET | `/api/v1/articles/{id}` | Détails article |
| GET | `/api/v1/articles/slug/{slug}` | Article par slug |
| POST | `/api/v1/articles` | Créer article |
| PUT | `/api/v1/articles/{id}` | Modifier |
| DELETE | `/api/v1/articles/{id}` | Supprimer |
| POST | `/api/v1/articles/{id}/publish` | Publier |
| POST | `/api/v1/articles/{id}/archive` | Archiver |
| POST | `/api/v1/articles/{id}/feature` | Mettre en avant |
| GET | `/api/v1/articles/homepage` | Articles homepage |
| GET | `/api/v1/articles/section/{section}` | Articles par section |
| GET | `/api/v1/categories` | Liste catégories |
| GET | `/api/v1/categories/{id}` | Détails catégorie |
| POST | `/api/v1/categories` | Créer catégorie |
| PUT | `/api/v1/categories/{id}` | Modifier |
| DELETE | `/api/v1/categories/{id}` | Supprimer |
| GET | `/api/v1/comments/article/{articleId}` | Commentaires article |
| POST | `/api/v1/comments` | Créer commentaire |
| PUT | `/api/v1/comments/{id}` | Modifier |
| DELETE | `/api/v1/comments/{id}` | Supprimer |
| POST | `/api/v1/comments/{id}/flag` | Signaler |
| POST | `/api/v1/comments/{id}/approve` | Approuver |

**Dashboard:** Section CMS/Etheria

---

### Media (`/api/v1/media/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/media` | Liste médias |
| POST | `/api/v1/media` | Upload média |
| DELETE | `/api/v1/media/{id}` | Supprimer |

**Dashboard:** Section médias

---

### User Features (`/api/v1/user/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/user/bookmarks` | Liste favoris |
| POST | `/api/v1/user/bookmarks` | Ajouter favori |
| DELETE | `/api/v1/user/bookmarks/{articleId}` | Retirer favori |
| GET | `/api/v1/user/history` | Historique lecture |
| POST | `/api/v1/user/history` | Ajouter à l'historique |
| DELETE | `/api/v1/user/history` | Vider historique |
| DELETE | `/api/v1/user/history/{articleId}` | Retirer de l'historique |
| GET | `/api/v1/user/notifications` | Notifications |
| PUT | `/api/v1/user/notifications/{id}/read` | Marquer lue |
| PUT | `/api/v1/user/notifications/read-all` | Tout marquer lu |
| DELETE | `/api/v1/user/notifications/{id}` | Supprimer |
| GET | `/api/v1/user/subscription` | Abonnement |
| POST | `/api/v1/user/subscription` | Souscrire |
| PUT | `/api/v1/user/subscription` | Modifier |
| POST | `/api/v1/user/subscription/cancel` | Résilier |

---

### Settings (`/api/v1/settings/*`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/settings` | Paramètres système |
| PUT | `/api/v1/settings` | Modifier |
| POST | `/api/v1/settings/test-email` | Tester email |

**Dashboard:** `/dashboard/settings/`

---

## Résumé des Endpoints

| Catégorie | Nombre d'endpoints |
|-----------|---------------------|
| Authentification | 7 |
| Profil & Sécurité | ~25 |
| Connexions | ~30 |
| Utilisateurs & Admin | ~15 |
| Applications & Organisations | ~15 |
| Contacts & Groupes | ~10 |
| Branding & Domaines | ~15 |
| Logs & Monitoring | ~15 |
| Activity & Stats | ~7 |
| Marketplace | ~6 |
| Actions & Extensions | ~20 |
| Agents | ~7 |
| CMS (Articles/Catégories) | ~20 |
| User Features | ~15 |
| **Total** | **~200+** |

---

## Notes d'implémentation

1. Tous les endpoints retournent un format standard:
   ```json
   {
     "success": boolean,
     "data": unknown,
     "error": string | undefined,
     "message": string | undefined
   }
   ```

2. L'authentification utilise Bearer Token dans le header `Authorization`

3. La plupart des endpoints de liste supportent la pagination via `page` et `pageSize`

4. Les endpoints de filtrage varient selon le contexte (level, event, user, etc.)