# 🎯 Vision TCG - Guide de test complet

## ✅ Corrections appliquées (2026-06-15)

### Problème 1: `TypeError: Cannot read properties of undefined (reading 'windowMs')`
**Cause:** `config.rateLimit` manquant  
**Fix:** Ajout dans `src/utils/config.js`
```js
rateLimit: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit par IP
}
```

### Problème 2: Port 3000 déjà utilisé
**Cause:** Défaut à 3000, souvent occupé  
**Fix:**
- Backend → port 3001 via `cross-env PORT=3001`
- Frontend → `.env` avec `VITE_API_URL=http://localhost:3001`
- Gestion erreur EADDRINUSE avec message clair

### Problème 3: Dossier `data/` manquant
**Cause:** Première exécution  
**Fix:** Auto-création dans `initDatabase()` avec `fs.mkdir(DB_DIR, { recursive: true })`

### Problème 4: Scorer dépendait d'une table `keywords` inexistante
**Cause:** Architecture trop complexe pour MVP  
**Fix:** `scorer-simple.js` sans dépendance DB (keywords hardcodés)

### Problème 5: Boutons "Marquer intéressant", "Marquer vu", "Passer" ne fonctionnaient pas
**Cause:** SQL UPDATE utilisait colonne `updated_at` inexistante  
**Fix:** Retiré `updated_at` de la requête PATCH

---

## 🚀 Instructions de test

### Option A : Script automatique (RECOMMANDÉ pour Windows)

```powershell
cd D:\Developpement\vision-tcg
git pull origin feature/mvp-step1
.\start-dev.bat
```

Le script fait automatiquement :
1. ✅ Installation des dépendances
2. ✅ Génération des données seed
3. ✅ Création du .env frontend
4. ✅ Démarrage backend (port 3001) dans une fenêtre
5. ✅ Démarrage frontend (port 5173) dans une autre fenêtre

**Puis ouvre http://localhost:5173** 🎯

---

### Option B : Manuel (étape par étape)

#### 1. Mise à jour du code

```powershell
cd D:\Developpement\vision-tcg
git fetch origin
git checkout feature/mvp-step1
git pull origin feature/mvp-step1
```

### 2. Installation des dépendances

```powershell
# Backend
cd backend
npm install  # Installe cross-env

# Frontend
cd ../frontend
npm install
```

### 3. Configuration frontend

Le fichier `frontend/.env` devrait déjà exister avec :
```
VITE_API_URL=http://localhost:3001
```

Si absent, le créer manuellement.

### 4. Génération des données de test

```powershell
cd backend
npm run db:seed
```

**Sortie attendue :**
```
🌱 Seeding database...
✅ Database initialized
📊 Created scrape run #1

✅ [1] Lot 50 cartes Pokemon Wizards Français dont Dracaufeu
   💰 89.99€ | 📍 Nice (2km) | ⭐ Score: 82
...
🎉 Seed completed successfully!
📦 Inserted 5 sample listings
```

### 5. Démarrage du backend

```powershell
cd backend
npm run dev
```

**Sortie attendue :**
```
[INFO] Initializing database...
📂 Database loaded from disk
✅ Database schema already exists
[INFO] Database initialized
[INFO] Server running on http://localhost:3001
[INFO] Environment: development
```

### 6. Démarrage du frontend (nouveau terminal)

```powershell
cd D:\Developpement\vision-tcg\frontend
npm run dev
```

**Sortie attendue :**
```
VITE v5.x.x ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 7. Tests à effectuer

#### ✅ Test 1: Page d'accueil
1. Ouvrir http://localhost:5173
2. Vérifier que 5 annonces s'affichent
3. Vérifier le tri par score (82, 79, 68, 66, 27)

#### ✅ Test 2: Détail d'une annonce
1. Cliquer sur la première annonce (score 82)
2. Vérifier tous les champs :
   - Titre complet
   - Prix 89.99€
   - Location Nice
   - Distance 2km
   - Description complète
   - Image placeholder

#### ✅ Test 3: Boutons d'action
1. Sur la page de détail, cliquer sur :
   - ⭐ **"Marquer intéressant"** → Status passe à "interested"
   - 👁 **"Marquer vu"** → Status passe à "reviewed"
   - ✗ **"Passer"** → Status passe à "passed"
2. Vérifier qu'aucune erreur ne s'affiche
3. Vérifier le badge de status change de couleur

#### ✅ Test 4: Filtres
1. Retour à la liste
2. Tester les filtres :
   - Status: "Intéressé" → affiche seulement ceux marqués
   - Prix max: 100€ → affiche 3 annonces (45€, 15€, 89.99€)
   - Distance max: 10km → affiche 2 annonces (2km, 5km)

#### ✅ Test 5: API directe
Tester avec curl ou navigateur :
```powershell
# Health check
curl http://localhost:3001/health

# Liste annonces
curl http://localhost:3001/api/listings?status=all

# Une annonce
curl http://localhost:3001/api/listings/1
```

---

## 🐛 Si ça ne fonctionne pas

### Backend affiche "Completed running" et s'arrête

**Symptôme :**
```
> cross-env PORT=3001 node --watch src/api/server.js
Completed running 'src/api/server.js'
```

**Solution :** Fix appliqué dans commit `592c8d9`
```powershell
git pull origin feature/mvp-step1
cd backend
npm run dev
```

Tu dois maintenant voir :
```
[INFO] Initializing database...
[INFO] Database initialized
[INFO] Server running on http://localhost:3001
```

---

### Backend ne démarre pas

**Erreur: "Port 3001 already in use"**
```powershell
# Trouver et tuer le processus
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Ou changer le port temporairement
set PORT=3002
npm run dev
```

**Erreur: "Cannot find module"**
```powershell
rm -r node_modules package-lock.json
npm install
```

### Frontend affiche "Failed to fetch"

1. ✅ Vérifier backend tourne : http://localhost:3001/health
2. ✅ Vérifier `frontend/.env` contient `VITE_API_URL=http://localhost:3001`
3. ✅ Redémarrer frontend après modification `.env`
4. ✅ Vérifier CORS (normalement OK)

### Base de données vide

```powershell
cd backend
npm run db:seed  # Régénère les données
```

### Boutons ne fonctionnent toujours pas

1. Ouvrir DevTools (F12)
2. Onglet "Console" → noter les erreurs
3. Onglet "Network" → vérifier requête PATCH /api/listings/:id
4. Me transmettre l'erreur exacte

---

## 📊 Données de test générées

| ID | Titre | Prix | Ville | Distance | Score | Site |
|----|-------|------|-------|----------|-------|------|
| 1 | Lot 50 cartes Pokemon Wizards Français... | 89.99€ | Nice | 2km | **82** | leboncoin |
| 5 | RARE Lot Cartes Pokemon Wizards FR Jungle... | 199€ | Nice | 5km | **79** | leboncoin |
| 3 | Pokemon cards lot Wizards english | 45€ | Cannes | 25km | **68** | leboncoin |
| 2 | Cartes Pokemon Wizards - Lot Complet... | 120€ | Antibes | 12km | **66** | vinted |
| 4 | Cartes Pokemon lot 20 cartes | 15€ | Monaco | 18km | **27** | vinted |

---

## ✅ Checklist de validation

- [ ] Backend démarre sur port 3001
- [ ] Frontend démarre sur port 5173
- [ ] 5 annonces affichées triées par score
- [ ] Détail annonce affiche tous les champs
- [ ] Bouton "Marquer intéressant" fonctionne
- [ ] Bouton "Marquer vu" fonctionne
- [ ] Bouton "Passer" fonctionne
- [ ] Filtres fonctionnent (status, prix, distance)
- [ ] Aucune erreur dans la console DevTools

---

## 🎯 Une fois validé

**Tu peux me confirmer :**
> ✅ "Tout fonctionne ! Backend + Frontend + Boutons OK"

**Et on pourra passer à :**
1. 🐳 Dockerisation
2. 🔄 CI/CD GitHub Actions
3. 🚀 Déploiement VPS
4. ⏰ Cron job scraping quotidien

---

## 📝 Notes techniques

### Scoring (0-100)
- **Wizards (40pts)** : wizards, wotc, base set, jungle, fossile
- **Français (20pts)** : français/francais/fr/vf vs english/en
- **Lot (20pts)** : collection, complet, quantité (50+ = +10pts)
- **Prix (10pts)** : <50€ = 10pts, <100€ = 8pts
- **Distance (10pts)** : <10km = 10pts, <25km = 7pts

### Architecture
- **Backend** : Express + SQLite (sql.js) + Puppeteer
- **Frontend** : React + Vite + theme "Heroic Fantasy Magic"
- **DB** : Auto-migration + auto-save toutes les 30s
- **Scraping** : Leboncoin ✅ Vinted ✅ (Facebook abandonné MVP)

---

**Créé le :** 2026-06-15  
**Branch :** feature/mvp-step1  
**Statut :** ✅ Prêt à tester
