# 🧪 TEST SCRAPING - Instructions pour Windows

## ⚠️ Prérequis
- Backend doit tourner (`npm run dev` dans `backend/`)
- Chrome sera ouvert automatiquement (mode headful)
- Prépare-toi à résoudre un CAPTCHA si nécessaire

---

## 📋 Test 1 : Vérifier que le serveur fonctionne

```powershell
curl.exe http://localhost:3001/health
```

**✅ Résultat attendu :**
```json
{"status":"ok","timestamp":"..."}
```

---

## 📋 Test 2 : Lister les profiles disponibles

```powershell
curl.exe http://localhost:3001/api/profiles
```

**✅ Résultat attendu :**
```json
{
  "profiles": [
    {
      "name": "wizards-fr",
      "enabled": true,
      ...
    }
  ]
}
```

---

## 📋 Test 3 : Charger le profile wizards-fr

```powershell
curl.exe http://localhost:3001/api/profiles/wizards-fr
```

**✅ Résultat attendu :**
Profile JSON complet avec search, scraping, scoring, filters

---

## 📋 Test 4 : Lancer un scraping DRY-RUN (sans sauvegarder en DB)

```powershell
$body = @{
    profile = "wizards-fr"
    sources = @("leboncoin")
    maxResults = 3
    saveToDb = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/scrape" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

**⏳ Ce qui va se passer :**

### Scénario A : CAPTCHA détecté (probable au 1er run)

1. **Un navigateur Chrome s'ouvre** automatiquement
2. La page Leboncoin se charge
3. **Un CAPTCHA DataDome apparaît** (challenge "Je suis un humain")
4. Dans la console backend tu verras :
   ```
   ⏳ CAPTCHA détecté ! Tu as 60 secondes pour le résoudre...
   ```
5. **ACTION REQUISE :** Clique sur "Je suis un humain" dans le navigateur
6. Attends que la page se charge complètement (tu verras les annonces)
7. Les cookies seront sauvegardés dans `backend/cookies/`
8. L'API retourne :
   ```json
   {
     "scrapeRunId": 1,
     "status": "captcha_required",
     "message": "CAPTCHA detected. Manual intervention required."
   }
   ```

**👉 Relance la MÊME commande** après avoir résolu le CAPTCHA. Cette fois les cookies seront utilisés et ça devrait passer.

---

### Scénario B : Pas de CAPTCHA (si cookies déjà présents ou chance)

L'API retourne immédiatement :
```json
{
  "scrapeRunId": 1,
  "status": "completed",
  "profile": "wizards-fr",
  "sources": ["leboncoin"],
  "stats": {
    "raw": 3,
    "normalized": 3,
    "invalid": 0,
    "scored": 3,
    "filtered": 2,
    "saved": 0,
    "updated": 0,
    "errors": 0
  },
  "listings": [
    {
      "title": "Lot cartes Pokemon...",
      "price": 150,
      "score": 78,
      "score_breakdown": {
        "keywords_score": 30,
        "price_score": 100,
        "distance_score": 100,
        "is_lot_score": 0
      },
      "url": "https://...",
      ...
    }
  ]
}
```

---

## 🐛 Si ça ne marche pas

### Erreur : `{}`

**Cause :** Erreur serveur silencieuse.

**Solution :**
1. Regarde les logs dans la console backend
2. Copie-colle l'erreur complète (stack trace)
3. Envoie-la moi

---

### Erreur : `"error": "Cannot read properties of undefined..."`

**Cause :** Config manquante ou fichier corrompu.

**Solution :**
```powershell
cd D:\Developpement\vision-tcg
git status    # Vérifie qu'il n'y a pas de conflits
git pull origin feature/mvp-step1   # Pull les derniers fixes
cd backend
npm install   # Réinstalle les dépendances au cas où
```

---

### Chrome ne s'ouvre pas

**Cause :** Puppeteer ne trouve pas Chrome.

**Solution :**
```powershell
# Vérifie que Chrome est installé
"C:\Program Files\Google\Chrome\Application\chrome.exe" --version
```

Si Chrome n'est pas trouvé, installe-le ou pointe PUPPETEER_EXECUTABLE_PATH dans `.env` :
```
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

---

### Le scraping timeout

**Cause :** Leboncoin est lent ou bloqué.

**Solution :**
- Attends que le navigateur se ferme
- Vérifie que tu as une bonne connexion internet
- Réessaye dans 1-2 minutes

---

## 📊 Que faire après un test réussi ?

1. **Note les résultats :**
   - Nombre de listings récupérés
   - Scores des listings
   - Temps de réponse approximatif

2. **Envoie-moi un screenshot ou copie-colle du JSON de réponse**

3. **Test suivant :** On pourra alors tester avec `saveToDb: true` pour vérifier la persistence

---

## 🎯 Commande rapide (copie-colle direct)

```powershell
# Test complet en une fois
Invoke-RestMethod -Uri "http://localhost:3001/api/scrape" -Method POST -Body '{"profile":"wizards-fr","sources":["leboncoin"],"maxResults":3,"saveToDb":false}' -ContentType "application/json" | ConvertTo-Json -Depth 10
```

Bonne chance ! 🚀
