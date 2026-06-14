# 🎴 Vision TCG - Détection de Lots Pokémon Wizards

MVP de détection et priorisation automatique de lots de cartes Pokémon (focus éditions Wizards FR) sur les marketplaces.

## 📋 Stack Technique

### Backend
- **Runtime**: Node.js 20 (ESM)
- **API**: Express + REST endpoints
- **Database**: SQLite (better-sqlite3)
- **Scraping**: Puppeteer (headful mode)
- **Tests**: Jest + Supertest

### Frontend
- **Framework**: React 18
- **Build**: Vite
- **UI**: Composants minimaux inline-styled

### Infra
- **Containerisation**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Browser**: Browserless Chrome (sidecar)

## 🚀 Quick Start

### Prérequis
- Node.js 20+
- Docker & Docker Compose (optionnel mais recommandé)

### Installation locale

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

Accès:
- Backend API: http://localhost:3000
- Frontend: http://localhost:5173

### Docker (recommandé)

```bash
# Mode développement
docker-compose -f docker-compose.dev.yml up

# Mode production
docker-compose up
```

## 📁 Structure du Projet

```
vision-tcg/
├── backend/
│   ├── src/
│   │   ├── api/           # Express server + routes
│   │   ├── db/            # Schema + migrations + seed
│   │   ├── fetchers/      # Scrapers (LBC, Vinted, FB)
│   │   ├── parsers/       # HTML parsers par site
│   │   ├── scoring/       # Algorithme de scoring
│   │   └── utils/         # Config + Logger
│   ├── tests/             # Jest tests
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── Dockerfile
└── docker-compose.yml
```

## 🔍 Fonctionnalités MVP

### ✅ Implémenté
- [x] API REST complète (listings, stats, update)
- [x] Schéma DB avec migrations et seed
- [x] Algorithme de scoring multi-critères
- [x] Fetcher Leboncoin avec CAPTCHA detection
- [x] Parser Leboncoin
- [x] Dashboard React avec filtres
- [x] Composants List + Detail + FilterBar
- [x] Docker multi-stage builds
- [x] GitHub Actions CI

### 🚧 À implémenter
- [ ] Fetcher Vinted (structure créée)
- [ ] Fetcher Facebook Marketplace (structure créée)
- [ ] Geocoding API pour coordonnées précises
- [ ] Tests E2E (Playwright)
- [ ] Job scheduler pour scraping automatique
- [ ] Export résultats (JSON/CSV)

## 🎯 Algorithme de Scoring

Score sur 100 points basé sur:
1. **Éditions Wizards** (0-40pts): Base Set, Jungle, Fossil, Neo, etc.
2. **Langue française** (0-20pts): Détection mots-clés FR
3. **Format lot** (0-15pts): Collection, multiple cartes
4. **Ratio prix/carte** (0-15pts): < 0.50€/carte = optimal
5. **Distance** (0-10pts): Depuis Nice (±50km)
6. **Pénalités**: Cartes japonaises, modernes

## 🧪 Tests

```bash
cd backend
npm test              # Run tests
npm test -- --coverage # Coverage report
```

Couverture cible: **70%** minimum

## 📡 API Endpoints

```
GET  /health                    # Health check
GET  /api/docs                  # API documentation
GET  /api/listings              # List avec filtres
GET  /api/listings/:id          # Détail annonce
PATCH /api/listings/:id         # Update status/notes
GET  /api/scrape-runs           # Historique scraping
GET  /api/stats                 # Statistiques
```

### Exemple requête

```bash
curl "http://localhost:3000/api/listings?min_score=70&status=new&max_price=1500"
```

## 🔐 Variables d'Environnement

Voir `backend/.env.example` pour la configuration complète.

**Essentielles:**
- `DB_PATH`: Chemin base SQLite
- `CHROMIUM_WS`: WebSocket Browserless
- `MAX_BUDGET`: Budget max (défaut: 1500€)
- `TARGET_LAT/LON`: Coordonnées Nice

## 🐛 Debugging

### CAPTCHA détecté
En cas de CAPTCHA, le fetcher:
1. Sauvegarde screenshot + HTML dans `screenshots/`
2. Interrompt l'exécution
3. Retourne erreur avec paths des fichiers

**Solution:** Résoudre manuellement ou utiliser proxy/service anti-CAPTCHA.

### Logs
```bash
# Niveau debug
LOG_LEVEL=debug npm run dev
```

## 📦 Déploiement

```bash
# Build images
docker-compose build

# Run en production
docker-compose up -d

# Vérifier logs
docker-compose logs -f
```

## 🤝 Contribution

1. Créer une branche feature: `git checkout -b feat/ma-feature`
2. Commit format: `type(scope): message`
   - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
3. Tests passants: `npm test`
4. Push et PR vers `dev`

## 📄 License

MIT

## 🎯 Contraintes Projet

- **Budget max:** 1500€
- **Zone:** Nice ±50km
- **Priorité:** Cartes Wizards FR
- **Mode scraping:** Headful (détection humaine)
- **Intervention humaine:** Obligatoire sur CAPTCHA

---

**Status:** 🟢 MVP Structure Complete  
**Next:** Implémenter Vinted/FB fetchers + geocoding réel
