# Handoff orchestrateur — Radar MVP Vision TCG

Date: 2026-06-18
Branche: `feature/ui-hunting-radar`

## Objectif produit

Construire un radar MVP pour détecter/prioriser des annonces de cartes Pokémon, priorité Wizards FR, zone Nice ±50 km, budget max 1500€, avec focus initial Vinted/Leboncoin.

Promesse cible: ne pas montrer toutes les annonces, mais les pistes potentiellement intéressantes avec score, estimation, niveau de risque et explication claire.

## Ce qui a été livré récemment

### 1. Scan multi-requêtes intelligent

- Ajout de requêtes par série ciblée:
  - `rocket`: Team Rocket, cartes obscures /82, Dracolosse/Dracaufeu/Tortank/Raichu obscur, etc.
  - `jungle`, `fossil`, `base`, fallback `all`.
- Déduplication globale par `source + external_id`.
- Conservation de `matched_queries`.
- Stats par requête exposées à l’UI.

Commit principal: `c627504 feat(radar): add smart multi-query scans`

### 2. Filtrage strict par série ciblée

- Si l’utilisateur cible Team Rocket, une annonce Jungle/Base/Fossile ne doit plus être gardée juste parce qu’elle est Wizards/FR.
- Ajout de `series_mismatch` dans les raisons de rejet.
- Le fallback exploration ne réintroduit plus du hors-série.

Commit principal: `28ee8fc fix(radar): enforce targeted series filtering`

### 3. Préfiltre Vinted avant ouverture des pages détail

- Le fetcher lit le texte visible de la grille Vinted avant d’ouvrir les pages détail.
- Pour une chasse Rocket, il évite maintenant d’ouvrir One Piece, Regice, Évoli hors Rocket, etc.
- Log attendu: `selected after already-seen + series prefilter`.

Commit principal: `a5e50bf fix(fetcher-vinted): prefilter targeted series results`

### 4. Mémoire anti-rescan

- Ajout de la table `seen_listings`.
- Les annonces analysées/rejetées sont mémorisées même si elles ne sont pas sauvegardées dans `listings`.
- Au scan suivant, les annonces déjà analysées encore actives sont exclues avant fetch détail.
- UI: compteurs `annonces déjà sauvegardées ignorées`, `annonces déjà analysées ignorées`, `décisions mémorisées`.

Commit principal: `8c4cdef feat(radar): add seen listings cache`

### 5. Score explicable

- Ajout de `explainListingScore()`.
- `score_breakdown.subscores` contient:
  - `series` /40
  - `language` /20
  - `lot` /15
  - `price` /15
  - `distance` /10
  - `risk` pénalités
- API expose:
  - `score_breakdown`
  - `score_subscores`
  - `score_explanation`
  - `series_detected`
- Modal détail affiche un bloc `SCORE EXPLICABLE`.

Commit principal: `0378fb7 feat(radar): add explainable scoring breakdown`

### 6. Correction Rocket vs Neo Destiny

Problème observé: `Feurisson obscur 39/105 - Wizards Neo Destiny` passait trop facilement dans une chasse Rocket car le mot `obscur` était utilisé trop largement.

Correction:
- `obscur` seul ne suffit plus.
- Rocket match si:
  - `Team Rocket` / `rocket`, ou
  - `obscur/obscure/obscurs` + numérotation `/82`.
- Donc:
  - `Kadabra obscur 39/82` => Rocket OK
  - `Rafflesia obscur 13/82` => Rocket OK
  - `Feurisson obscur 39/105` => Neo Destiny, pas Rocket

## Point technique actuel — ERR_CONNECTION_RESET

Symptôme côté utilisateur:

```txt
POST http://localhost:3001/api/scrape/start net::ERR_CONNECTION_RESET
```

Contexte utilisateur:
- Semble être arrivé avec `series=rocket` et budget `200`.
- L’utilisateur a ensuite relancé un autre scan qui semblait tourner.

Reproduction locale faite côté agent:
- Backend lancé sur `PORT=3099`.
- POST testé avec:

```json
{
  "sources": ["vinted"],
  "maxResults": 1,
  "saveToDb": false,
  "waitForCaptcha": 1,
  "filters": {
    "series": "rocket",
    "budget": { "max": 200 },
    "sensitivity": "normal"
  }
}
```

Résultat local:
- Pas de reset.
- HTTP 200 avec JSON.
- Status applicatif `failed` car Chromium headful ne peut pas démarrer dans l’environnement Linux sans `$DISPLAY`.
- Les erreurs Puppeteer sont bien capturées en `query_error`.

Correctif additionnel effectué après diagnostic:
- Si toutes les requêtes échouent, `startScrape()` renvoie maintenant `status: "failed"` au lieu de `completed`.
- Cela rend l’état UI/backend plus clair, mais ne prouve pas encore la cause du reset Windows.

Hypothèses restantes pour le reset Windows:
1. Backend local Windows a crashé pendant un run Puppeteer réel.
2. Le navigateur/processus Chromium a fermé brutalement la connexion HTTP.
3. Scan précédent encore en cours + relance rapide / port/backend instable.
4. Code local utilisateur pas encore à jour au dernier commit.

À demander/collecter si le reset revient:
- Sortie terminal backend au moment exact du reset.
- Vérifier si `npm run dev` est toujours actif après le reset.
- Vérifier `curl http://localhost:3001/health` juste après le reset.
- Payload exact de la chasse: série, budget, sensibilité, maxResults.

## Tests/validations récents

Dernières validations ciblées passées:

```txt
explainable-scoring.test.js
listing-quality.test.js
fetchers.test.js
seen-listing-repository.test.js
```

Dernière validation complète projet avant le dernier commit scoring:

```txt
frontend build PASS
validate-before-push PASS
validate-runtime PASS
```

Note: la suite backend complète contient encore des tests legacy instables/non alignés ESM/sql.js (`parsers.test`, `api.test` avaient été partiellement corrigés mais pas traités comme priorité produit). Les validations ciblées couvrent les blocs Radar modifiés.

## Ce qui reste à faire pour MVP Radar

### Priorité 1 — Stabilisation scrape runtime Windows

Objectif: plus de `ERR_CONNECTION_RESET`, même si Puppeteer/Vinted échoue.

Actions recommandées:
- Ajouter gestion globale `process.on('unhandledRejection')` / `uncaughtException` avec logs non secrets.
- Retourner HTTP 500/503 JSON clair si le scan échoue totalement, au lieu d’un reset.
- Éventuellement limiter un seul scan concurrent via verrou en mémoire.
- Ajouter endpoint `/api/jobs/status` ou statut scan en cours.

### Priorité 2 — Résumé de scan actionnable

Objectif: comprendre en UI pourquoi une annonce a disparu.

Afficher clairement:
- brutes trouvées
- sélectionnées avant détail
- déjà vues ignorées
- hors série
- hors budget
- rejet qualité
- sauvegardées / mises à jour
- top exemples rejetés avec raison

### Priorité 3 — Watchlist/statuts workflow

Objectif: transformer le radar en outil utilisable.

À faire:
- `Intéressé`
- `Vu`
- `Ignorer`
- filtre statut
- vue watchlist
- tri par score/date/prix

### Priorité 4 — Nettoyage tests legacy / release locale

Objectif: avoir une base fiable avant merge MVP.

À faire:
- stabiliser `api.test` en ESM sans charger jsdom/fetchers inutilement.
- stabiliser `parsers.test` ou le remplacer par les tests scorer modernes.
- documenter commandes Windows.
- vérifier `.env.example`, port 3001, DB path.

## Recommandation orchestrateur

Avant de continuer les features UI, traiter un petit bloc de robustesse:

```txt
fix(api): make scrape endpoint crash-safe and single-flight
```

Puis continuer avec:

```txt
feat(radar): expose actionable scan summary
feat(radar): add watchlist and status workflow
```
