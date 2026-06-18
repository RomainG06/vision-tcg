# MVP local — guide de test Windows

Branche MVP actuelle: `feature/ui-hunting-radar`

## 1. Récupérer la dernière version

```powershell
cd D:\Developpement\vision-tcg
git checkout feature/ui-hunting-radar
git pull origin feature/ui-hunting-radar
```

## 2. Backend

```powershell
cd D:\Developpement\vision-tcg\backend
copy .env.example .env
npm install
npm run dev
```

Backend attendu:

```txt
http://localhost:3001
http://localhost:3001/health
http://localhost:3001/api/docs
```

Vérification rapide:

```powershell
curl http://localhost:3001/health
curl http://localhost:3001/api/jobs/status
```

## 3. Frontend

Dans un deuxième terminal:

```powershell
cd D:\Developpement\vision-tcg\frontend
copy .env.example .env
npm install
npm run dev
```

Frontend attendu:

```txt
http://localhost:5173
```

## 4. Parcours MVP à tester

1. Ouvrir le dashboard.
2. Configurer une chasse:
   - série: Team Rocket ou Toutes Wizards FR
   - budget: 200 à 1500 selon test
   - sensibilité: Équilibré ou Agressif
3. Lancer la chasse.
4. Lire le résumé actionnable:
   - pistes exploitables
   - déjà vues ignorées
   - hors budget
   - rejet qualité/série
5. Si beaucoup d’annonces déjà vues sont ignorées après recalibrage, cocher:

```txt
Ré-analyser les déjà vues
```

6. Ouvrir une annonce et tester les statuts:
   - Watchlist
   - Vu
   - Ignorer
   - Contacté
7. Tester les filtres:
   - Tous
   - Nouveau
   - Watchlist
   - Vu
   - Ignoré
   - Contacté
8. Tester les tris:
   - Plus récent
   - Meilleur score
   - Prix croissant

## 5. Validation développeur avant push

Depuis la racine du repo:

```powershell
cd D:\Developpement\vision-tcg
```

Backend:

```powershell
cd backend
npm test -- --runInBand
```

Frontend:

```powershell
cd ..\frontend
npm run build
```

Scripts projet depuis la racine, si disponibles:

```powershell
bash scripts/validate-before-push.sh
bash scripts/validate-runtime.sh
```

## 6. Notes scraping MVP

- Le scraping est headful: une fenêtre Chromium peut s’ouvrir.
- Si CAPTCHA/DataDome apparaît: résoudre manuellement ou relancer plus tard.
- Leboncoin reste plus agressif côté anti-bot; Vinted est le chemin MVP principal.
- Ne pas utiliser de proxy payant sans validation explicite.

## 7. État des blocs MVP

- Bloc 1 — Robustesse scrape runtime: fait.
- Bloc 2 — Résumé de scan actionnable: fait.
- Bloc 2.1 — Résumé plus lisible + ré-analyse déjà vues: fait.
- Bloc 3 — Watchlist/statuts/tri: fait.
- Bloc 4 — Nettoyage tests legacy + release locale: en cours/fait selon dernier commit.

## 8. Reste après release locale

Priorité suivante recommandée:

- polish responsive rapide
- message utilisateur plus propre si Vinted bloque
- documentation finale README simplifiée
- éventuellement reset mémoire ciblé par série/source
- amélioration scan/prix après MVP fonctionnel
