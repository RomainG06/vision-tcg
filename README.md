# Vision TCG - MVP Step 1

Détection et priorisation de lots de cartes Pokémon (focus Wizards FR).

## 🚀 Démarrage rapide

### Prérequis
- Node.js v22+
- Git

### Installation

```powershell
# Cloner le repo
git clone https://github.com/RomainG06/vision-tcg.git
cd vision-tcg
git checkout feature/mvp-step1

# Backend
cd backend
npm install
npm run dev  # Démarre sur http://localhost:3001

# Frontend (nouveau terminal)
cd ../frontend
npm install
npm run dev  # Démarre sur http://localhost:5173
```

### Accès

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health check**: http://localhost:3001/health

## 📦 Structure du projet

```
vision-tcg/
├── backend/          # API Express + SQLite
│   ├── src/
│   │   ├── api/      # Routes et serveur
│   │   ├── db/       # Base de données
│   │   ├── fetchers/ # Scrapers (Leboncoin, Vinted)
│   │   ├── scoring/  # Système de scoring
│   │   └── utils/    # Config, logger, cookies
│   └── data/         # Base SQLite (dev.db)
├── frontend/         # React + Vite
│   └── src/
│       ├── components/  # Composants UI
│       ├── services/    # API client
│       └── theme.js     # Design system
└── README.md
```

## 🛠️ Scripts disponibles

### Backend
```powershell
npm run dev           # Mode dev avec hot-reload (port 3001)
npm start             # Mode production (port 3000)
npm run scrape:lbc    # Scraper Leboncoin
npm run scrape:vinted # Scraper Vinted
npm run scrape:all    # Tous les scrapers
npm run resolve:captcha  # Résoudre CAPTCHA manuellement
npm run clear:cookies    # Effacer cookies
```

### Frontend
```powershell
npm run dev     # Mode dev (port 5173)
npm run build   # Build production
npm run preview # Preview du build
```

## 🔧 Configuration

### Backend
Port par défaut : `3001` (configuré dans `package.json` via `cross-env`)

### Frontend
Créer `frontend/.env` (déjà configuré) :
```
VITE_API_URL=http://localhost:3001
```

## 🐛 Résolution des problèmes

### "Port already in use"
```powershell
# Windows : tuer le processus sur le port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Ou changer le port :
cd backend
cross-env PORT=3002 npm run dev
```

### "Cannot find module"
```powershell
# Réinstaller les dépendances
cd backend
rm -r node_modules package-lock.json
npm install

cd ../frontend
rm -r node_modules package-lock.json
npm install
```

### "Failed to fetch" dans le frontend
1. Vérifier que le backend tourne sur http://localhost:3001
2. Vérifier `frontend/.env` : `VITE_API_URL=http://localhost:3001`
3. Redémarrer le frontend après modification de `.env`

## 📊 État des features

✅ **Backend** :
- API Express fonctionnelle
- Base SQLite avec migrations auto
- Scoring des annonces
- 2 fetchers : Leboncoin + Vinted

✅ **Frontend** :
- Dashboard React
- Liste et détail des annonces
- Filtres (prix, distance, status)
- Design "Heroic Fantasy Magic"

✅ **Scraping** :
- Mode headful (Chrome visible)
- Résolution CAPTCHA manuelle (60s)
- Cookies persistants
- UPSERT en DB (pas de doublons)

## 🎯 Prochaines étapes

- [ ] Dockerisation
- [ ] CI/CD GitHub Actions
- [ ] Déploiement VPS
- [ ] Cron job scraping quotidien
- [ ] Tests E2E

## 📝 Notes techniques

### Gestion des CAPTCHA
1. Si CAPTCHA détecté → attente 60s
2. Résoudre manuellement dans la fenêtre Chrome
3. Cookies sauvegardés automatiquement
4. Réutilisation des cookies (~24h de validité)

### Base de données
- SQLite via `sql.js` (pure JS, pas de compilation native)
- Auto-migration au démarrage
- Sauvegarde auto toutes les 30s
- Fichier : `backend/data/dev.db`

### Scrapers
- **Leboncoin** : 100% fonctionnel ✅
- **Vinted** : 100% fonctionnel ✅
- **Facebook Marketplace** : Abandonné MVP (nécessite login)

## 🤝 Contribution

Voir [SOUL.md](SOUL.md) pour le contexte et la vision du projet.

## 📄 Licence

Propriétaire - Usage interne uniquement
