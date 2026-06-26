# Guide d'authentification JWT - Vision TCG

## Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```bash
# Secret pour signer les tokens JWT (CHANGEZ EN PRODUCTION!)
JWT_SECRET=votre-secret-tres-long-et-aleatoire-ici

# En développement uniquement : permet de skip l'auth
SKIP_AUTH=true  # Mettre à false en production
```

## Mode développement

### Option 1 : Skip l'authentification (recommandé pour dev)

Dans `.env` :
```bash
SKIP_AUTH=true
```

Toutes les requêtes passeront sans token.

### Option 2 : Générer un token de développement

```javascript
// backend/generate-dev-token.js
import { generateToken } from './src/api/auth.js';

const devToken = generateToken({ 
  userId: 'dev-user', 
  role: 'admin' 
}, '7d'); // Valide 7 jours

console.log('Token de développement:');
console.log(devToken);
```

Exécuter :
```bash
node backend/generate-dev-token.js
```

## Utilisation de l'API avec authentification

### Requêtes avec token

Incluez le token dans le header `Authorization` :

```bash
# Exemple avec curl
curl -X POST http://localhost:3001/api/scrape/start \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"profile":"wizards-fr","sources":["vinted"],"maxResults":10}'
```

### Frontend (fetch)

```javascript
const token = localStorage.getItem('jwt_token'); // À implémenter

fetch('http://localhost:3001/api/scrape/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    profile: 'wizards-fr',
    sources: ['vinted'],
    maxResults: 10
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## Endpoints protégés

Les endpoints suivants nécessitent une authentification :

- `POST /api/scrape/start` - Lancer un scraping
- `PATCH /api/listings/:id` - Modifier une annonce
- `DELETE /api/listings` - Supprimer toutes les annonces
- `DELETE /api/listings/:id` - Supprimer une annonce

## Endpoints publics

Ces endpoints sont accessibles sans authentification :

- `GET /health` - Health check
- `GET /api/docs` - Documentation API
- `GET /api/listings` - Liste des annonces
- `GET /api/listings/:id` - Détails d'une annonce
- `GET /api/alerts` - Alertes
- `GET /api/stats` - Statistiques
- `GET /api/jobs/status` - Statut du scraping

## Production

### Générer un secret fort

```bash
# Avec Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Avec OpenSSL
openssl rand -hex 64
```

### Configuration production

```bash
# .env (production)
NODE_ENV=production
JWT_SECRET=votre-secret-genere-avec-commande-ci-dessus
SKIP_AUTH=false  # IMPORTANT : désactiver le skip en production !
```

### Génération de tokens pour utilisateurs

```javascript
// backend/create-user-token.js
import { generateToken } from './src/api/auth.js';

const userToken = generateToken({ 
  userId: 'user-123',
  email: 'user@example.com',
  role: 'user' 
}, '30d'); // 30 jours

console.log(`Token pour user-123:`);
console.log(userToken);
```

## Vérification de token

Pour vérifier si un token est valide :

```javascript
import { verifyToken } from './src/api/auth.js';

const token = 'eyJhbGc...';
const payload = verifyToken(token);

if (payload) {
  console.log('Token valide:', payload);
} else {
  console.log('Token invalide ou expiré');
}
```

## Codes d'erreur

- `401 Unauthorized` : Token manquant, invalide ou expiré
- `403 Forbidden` : Token valide mais permissions insuffisantes (à implémenter)
- `429 Too Many Requests` : Rate limit dépassé

## Exemple de cycle complet

1. **Générer un token (dev)** :
   ```bash
   node backend/generate-dev-token.js
   ```

2. **Copier le token**

3. **Tester un endpoint protégé** :
   ```bash
   curl -X POST http://localhost:3001/api/scrape/start \
     -H "Authorization: Bearer eyJhbGc..." \
     -H "Content-Type: application/json" \
     -d '{"profile":"wizards-fr"}'
   ```

4. **Vérifier la réponse** :
   - ✅ 200 OK : Scraping lancé
   - ❌ 401 : Token invalide/manquant
   - ❌ 429 : Trop de requêtes (attendre 1 minute)

## Troubleshooting

### "Unauthorized" alors que SKIP_AUTH=true

Vérifiez que :
- Le fichier `.env` est bien chargé
- Vous êtes en `NODE_ENV=development`
- Redémarrez le serveur après modification du `.env`

### "Invalid token"

- Le token a peut-être expiré (générez-en un nouveau)
- Le `JWT_SECRET` a changé (les anciens tokens sont invalides)
- Le format du header est incorrect (doit être `Bearer TOKEN`)

### Frontend : CORS error

Si vous utilisez l'auth depuis le frontend, vérifiez que :
- `FRONTEND_URL` dans `.env` correspond à votre URL frontend
- Les credentials sont activés : `credentials: true` dans fetch
