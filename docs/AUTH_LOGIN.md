# Auth login token — Vision TCG Radar

## Objectif

Le MVP protège le dashboard avec un écran de login simple : l'utilisateur colle un **token d'accès**. Le backend l'échange contre un JWT applicatif utilisé ensuite dans les appels API.

## Variables backend

Dans `backend/.env` :

```env
JWT_SECRET=une-longue-valeur-random-a-ne-jamais-committer
JWT_EXPIRES_IN=7d
ACCESS_TOKENS=token-romain,token-backup
LOGIN_RATE_LIMIT_WINDOW_MS=300000
LOGIN_RATE_LIMIT_MAX=5
SKIP_AUTH=false
```

Notes :

- `ACCESS_TOKENS` accepte plusieurs tokens séparés par des virgules.
- Les tokens réels ne doivent jamais être envoyés dans le chat ni committés.
- En développement uniquement, si `ACCESS_TOKENS` est vide, le backend accepte `dev-access-token` pour tester l'écran login.
- En production, le fallback `dev-access-token` n'est pas actif (`NODE_ENV=production`).

## Flux API

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"token":"dev-access-token"}'
```

Réponse :

```json
{
  "token": "jwt...",
  "token_type": "Bearer",
  "expires_in": "7d",
  "user": {
    "userId": "radar-user",
    "role": "user",
    "email": "collector@visiontcg.local"
  }
}
```

### Session courante

```bash
curl http://localhost:3001/api/auth/me \
  -H "<bearer-jwt-header>"
```

## Comportement frontend

- `LoginPage.jsx` affiche l'écran de connexion.
- Le JWT est stocké dans `localStorage` sous `vision-tcg.authToken`.
- Les appels API ajoutent automatiquement :

```http
<bearer-jwt-header>
```

- Si une API renvoie `401`, la session locale est supprimée et l'utilisateur revient à l'écran login.
- Le bouton `Déconnexion` efface la session et revient au login.

## Rate limit login

Le endpoint public `/api/auth/login` a un rate-limit dédié :

```env
LOGIN_RATE_LIMIT_WINDOW_MS=300000
LOGIN_RATE_LIMIT_MAX=5
```

Par défaut : 5 tentatives / 5 minutes / IP.

## Run local

Backend :

```bash
cd backend
npm install
npm run dev
```

Frontend :

```bash
cd frontend
npm install
npm run dev
```

Puis ouvrir le frontend et coller :

```txt
dev-access-token
```

si `ACCESS_TOKENS` est vide en dev.

## Checklist avant production

- [ ] `NODE_ENV=production`
- [ ] `SKIP_AUTH=false`
- [ ] `JWT_SECRET` long et unique
- [ ] `ACCESS_TOKENS` défini hors repo
- [ ] token partagé via canal sûr, jamais dans Git ni dans le chat
- [ ] vérifier que le login invalide renvoie bien `401`
- [ ] vérifier que le dashboard charge avec un token valide


