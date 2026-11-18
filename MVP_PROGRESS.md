# Vision TCG - Progression MVP "Hunting"

**Stratégie**: Option B - Évolution progressive de l'existant ✅

---

## ✅ Phase 1: Base fonctionnelle (TERMINÉ)

### Backend
- [x] API REST Express sur port 3001
- [x] SQLite avec sql.js (compatibilité Windows)
- [x] Routes principales:
  - [x] GET /health
  - [x] GET /api/listings (avec filtrage status)
  - [x] GET /api/listings/:id
  - [x] PATCH /api/listings/:id (update status)
  - [x] GET /api/stats
- [x] Database auto-migration (schema.sql)
- [x] Seed fonctionnel (5 listings sample)
- [x] Gestion erreurs + logging

### Frontend
- [x] React + Vite
- [x] Liste des annonces avec tri par score
- [x] Détail d'une annonce
- [x] Boutons status (intéressant/vu/passer)
- [x] Design "Heroic Fantasy Magic" intégré

### Scraping
- [x] Fetcher Leboncoin (headful, stealth)
- [x] Fetcher Vinted (headful, stealth)
- [x] Gestion CAPTCHA DataDome (60s wait)
- [x] Persistance cookies
- [x] Scripts npm: scrape:lbc, scrape:vinted, scrape:all
- [x] UPSERT pattern (re-scraping sans doublons)

### DevOps
- [x] Script Windows start-dev.bat
- [x] Documentation: README.md, TESTING_GUIDE.md
- [x] Git workflow: feature/mvp-step1 → dev
- [x] Corrections Windows (import.meta.url, cross-env)

**Commits**: 10 commits pushés sur feature/mvp-step1
**Status**: ✅ Backend démarre, frontend affiche les données, scraping fonctionne

---

## 🔄 Phase 2: Architecture "Hunting" (EN COURS)

### Backend - Architecture
- [ ] Créer `src/services/normalizer.js`
  - [ ] Normaliser format LBC → schéma commun
  - [ ] Normaliser format Vinted → schéma commun
  - [ ] Tests unitaires normalizer
- [ ] Créer `src/repositories/listingsRepository.js`
  - [ ] Abstraire accès DB
  - [ ] Méthodes: findAll, findById, create, update, delete
  - [ ] Tests unitaires repository
- [ ] Refactoriser routes.js pour utiliser repository

### Profiles système
- [ ] Créer `/profiles/` directory
- [ ] Format `profiles/wizards-fr.json`:
  ```json
  {
    "id": "wizards-fr",
    "name": "Wizards Français prioritaire",
    "sites": ["leboncoin", "vinted"],
    "keywords": ["pokemon", "wizards", "française", "dracaufeu"],
    "filters": {
      "maxPrice": 1500,
      "maxDistance": 50,
      "location": "Nice"
    },
    "scoring": {
      "wizards": 30,
      "french": 20,
      "price": 20,
      "distance": 15,
      "keywords": 15
    }
  }
  ```
- [ ] Loader de profiles dans backend
- [ ] API GET /api/profiles

### Script cron
- [ ] Créer `/scripts/run_profile.sh`
  - [ ] Accepter profile_id en argument
  - [ ] Lire config depuis profiles/*.json
  - [ ] Exécuter scraping pour chaque site
  - [ ] Exit codes: 0=ok, 2=captcha, 3=failed
  - [ ] Logs structurés
- [ ] Tester manuellement: `./scripts/run_profile.sh wizards-fr`
- [ ] Documentation cron

### Logging & Ops
- [ ] Créer `/opt/data/logs/vision-tcg/` si nécessaire
- [ ] Logger rotation (keep 7 days)
- [ ] Permissions cookies (chmod 600)
- [ ] .env.local pour secrets

---

## 🎨 Phase 3: Design "Hunting" (EN COURS - Guidance Ready)

### Design System Assets ✅
- [x] Design tokens disponibles (`design/tokens/hunting-tokens.json`)
- [x] Documentation complète (`design/README-hunting-design.md`)
- [x] Mockups référence (`design/mockups/hunting-dashboard.svg`)
- [x] Preview interactif (`design/preview-hunting.html`)

### Implementation Guides ✅
- [x] **PHASE3_IMPLEMENTATION_GUIDE.md** - Guide détaillé complet
- [x] **PHASE3_QUICK_DECISIONS.md** - Résumé des décisions rapides
- [x] **PHASE3_CODE_EXAMPLES.md** - Exemples de code transformation

### Décisions Architecture ✅
- [x] **Approche**: Remplacement progressif (pas de UI parallèle)
- [x] **Pattern**: Inline styles (garder existant, pas de CSS-in-JS library)
- [x] **Scope Phase 3**: Cards feed + badges (radar widget → Phase 4)
- [x] **Responsive**: Mobile-first, breakpoints 375px/768px/1440px
- [x] **Accessibilité**: WCAG AA, keyboard nav, ARIA labels

### Implémentation Frontend
- [ ] **Semaine 1**: Theme swap (hunting-tokens.json → theme.js)
  - [ ] Remplacer couleurs Fantasy → Hunting
  - [ ] Mettre à jour typographie (Outfit + Inter + JetBrains Mono)
  - [ ] Header: "Vision Hunting" + hunt status bar
  - [ ] Tester: tout fonctionne encore
  
- [ ] **Semaine 2**: Component enhancement
  - [ ] Créer `utils/rarity.js` (score tier logic)
  - [ ] Créer `components/Badge.jsx`
  - [ ] LotList.jsx: rarity styling basé sur score
  - [ ] Afficher badges depuis `opportunity_signals`
  - [ ] Afficher value_estimate et risk_signals
  
- [ ] **Semaine 3**: Polish & responsive
  - [ ] Grid responsive (CSS classes + media queries)
  - [ ] Keyboard navigation (tabIndex, onKeyPress)
  - [ ] ARIA labels pour accessibilité
  - [ ] Animations (huntPulse, scoreGlow)
  - [ ] Tests multi-devices
  
- [ ] Valider avec Romain

---

## 🧪 Phase 4: Tests & Qualité (À VENIR)

### Tests unitaires
- [ ] Tests normalizer (coverage ≥80%)
- [ ] Tests repository (coverage ≥80%)
- [ ] Tests scorer (coverage ≥80%)
- [ ] Tests routes API (supertest)

### Tests E2E
- [ ] Playwright: workflow complet scraping
- [ ] Playwright: workflow frontend (liste → détail → update status)

### CI/CD
- [ ] GitHub Actions: lint + test
- [ ] GitHub Actions: build

---

## 📦 Phase 5: Production (À VENIR)

- [ ] Dockerisation backend
- [ ] Dockerisation frontend
- [ ] docker-compose.yml
- [ ] Documentation déploiement
- [ ] Backup strategy DB

---

## 📊 Métriques actuelles

| Métrique | Valeur |
|----------|--------|
| Commits feature/mvp-step1 | 11 |
| Lignes backend | ~1500 |
| Lignes frontend | ~800 |
| Routes API | 5 |
| Fetchers | 2 (LBC, Vinted) |
| Tests unitaires | 0 |
| Coverage | 0% |
| Design assets | 0 |

---

## 🎯 Prochaines actions (priorité)

1. **URGENT**: Valider que backend + frontend fonctionnent (Romain teste)
2. Créer normalizer + repository
3. Implémenter système profiles
4. Créer script run_profile.sh
5. Demander design assets à agent design
6. Ajouter tests unitaires

---

**Dernière mise à jour**: 2026-06-15 15:30 UTC
**Branch**: feature/mvp-step1
**Status global**: 🟢 Phase 1 terminée, Phase 2 à démarrer après validation Romain
