# 🚨 STRATÉGIE ULTRA-PRUDENTE POST-CAPTCHA - RÉSUMÉ

**Date:** 2026-06-26  
**Problème:** LBC bloque immédiatement après résolution du CAPTCHA  
**Solution:** Cooldown 90s + 1 seul listing + délais ultra-longs  

---

## ✅ Modifications Implémentées

### Backend: `leboncoin.js`

```javascript
// 1. Flag pour tracer l'état post-CAPTCHA
let captchaJustResolved = false;

// 2. CAPTCHA résolu → attendre 90s (pas 30s)
await new Promise(resolve => setTimeout(resolve, 15000)); // Attendre 15s
if (await this.detectRateLimit()) {
  await new Promise(resolve => setTimeout(resolve, 90000)); // Cooldown 90s !!!
}

// 3. Limiter à 1 seul listing après CAPTCHA
if (captchaJustResolved) {
  options.maxResults = Math.min(1, maxResults); // Force 1 !
}

// 4. Délais ultra-longs post-CAPTCHA
const delayListing = captchaJustResolved 
  ? 8000 + Math.random() * 7000  // 8-15s (vs 3-6s normal)
  : 3000 + Math.random() * 3000;
```

### Frontend: `HuntLaunchPanel.jsx`

- ✅ Nouveaux messages d'erreur pour post-CAPTCHA
- ✅ Modal CAPTCHA explique 90s cooldown
- ✅ Consigne : 1 listing seul après CAPTCHA, attendre 30+ min

---

## 🎯 Comportement Attendu

### Scénario: CAPTCHA Déclenché

```
1. LBC demande CAPTCHA
2. Utilisateur résout manuellement (~30-60s)
3. [APRÈS résolution]
   ├─ Attendre 15 secondes
   ├─ Vérifier si rate limit
   ├─ Si oui → Attendre 90 secondes supplémentaires (TOTAL 105s+)
   ├─ Si non → OK de continuer
4. Fetch 1 listing SEULEMENT
5. Attendre 8-15s entre étapes
6. [Fin du scan]
7. Scan récupère 1 listing (mieux que 0)
8. Utilisateur peut relancer dans 30+ minutes
```

### Scénario: Pas de CAPTCHA

```
1. Navigation normal
2. Délais 3-6s entre listings (aucun changement)
3. Fetch N listings
4. [Fin du scan normal]
```

---

## 🧪 Comment Tester

### Test 1: Comportement normal (sans CAPTCHA)
```bash
curl -X POST http://localhost:3001/api/scrape/start \
  -H "Content-Type: application/json" \
  -d '{
    "profile": "wizards-fr",
    "sources": ["leboncoin"],
    "filters": { "sensitivity": "prudent" }
  }'
# → Doit fetcher 2 listings normalement avec délais 3-6s
```

### Test 2: Comportement post-CAPTCHA (le plus important!)
```bash
# 1. Lancer scan qui va déclencher CAPTCHA
# 2. Observer les logs:
#    ✅ "⏳ CAPTCHA/DataDome Leboncoin détecté"
# 3. Résoudre CAPTCHA dans Chrome manuellement
# 4. Observer suite des logs:
#    ✅ "✅ CAPTCHA résolu"
#    ✅ "⏳ [LBC] Waiting 90s post-CAPTCHA before checking..."
#    ✅ "[LBC] CAPTCHA just resolved - limiting to 1 listing"
#    ✅ "[LBC] Waiting 8000-15000ms before next listing fetch"
# 5. Vérifier: 1 seul listing fetched, pas de blocage "Accès temporairement restreint"
# 6. Vérifier: Message "Attends 30+ minutes avant de relancer"
```

---

## 📊 Avant vs Après

| Étape                   | AVANT (Crash) | APRÈS (OK)      |
| ----------------------- | ------------- | --------------- |
| CAPTCHA résolu          | ✅             | ✅               |
| Attente post-CAPTCHA    | 30s           | **90s**         |
| Vérif rate limit        | ✅             | ✅               |
| Nombre listings fetched | 2-3 → CRASH   | **1 seulement** |
| Délai inter-listings    | 3-6s          | **8-15s**       |
| Résultat final          | ❌ Bloqué      | ✅ 1 listing     |

---

## 🔗 Fichiers Modifiés

| Fichier                                       | Modification                            |
| --------------------------------------------- | --------------------------------------- |
| `backend/src/fetchers/leboncoin.js`           | ✅ Cooldown 90s, 1 listing, délais longs |
| `frontend/src/components/HuntLaunchPanel.jsx` | ✅ Messages + modal mis à jour           |
| `RATE_LIMIT_FIX.md`                           | ✅ Documentation ultra-prudence          |

---

## ⚠️ Important

1. **Cette stratégie réduit le nombre de résultats** (1 au lieu de 2-3 post-CAPTCHA)
   - C'est intentionnel pour éviter le blocage permanent
   - Mieux d'avoir 1 listing que 0 (blocage total)

2. **L'utilisateur doit attendre 30+ minutes après CAPTCHA**
   - LBC impose un cooldown très long à niveau du backend DataDome
   - Pas grand chose à faire contre ça

3. **Sans CAPTCHA, comportement normal**
   - Aucun changement pour les sessions sans CAPTCHA
   - Délais 3-6s, fetch normal

---

## 📝 Notes pour la production

- Monitorer les métriques `rate_limits_hit` et `captcha_encountered`
- Si CAPTCHA se reproduit après 30 min → considérer augmenter cooldown à 120s
- Si problème persiste → considérer déprioritiser LBC ou utiliser uniquement Vinted
- Le système enregistre désormais `captchaJustResolved` pour tracking

---

**Status:** ✅ DÉPLOYÉ  
**Tested:** ⏳ En attente du test utilisateur avec CAPTCHA réel
