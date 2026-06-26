Résumé de la Solution Ultra-Prudente Post-CAPTCHA
===================================================

PROBLÈME IDENTIFIÉ:
- LBC bloque immédiatement après résolution du CAPTCHA
- Message d'erreur: "dès que j'ai résolu le captcha j'ai eu la page de blocage"
- Le système continuait à faire des requêtes, déclenchant le blocage

SOLUTION DÉPLOYÉE:
1. Cooldown post-CAPTCHA: 30s → 90 secondes
2. Nombre d'annonces: 2-3 → 1 seul après CAPTCHA
3. Délais: 3-6s → 8-15s après CAPTCHA
4. Logging amélioré pour tracker l'état

FICHIERS MODIFIÉS:
✅ backend/src/fetchers/leboncoin.js
✅ frontend/src/components/HuntLaunchPanel.jsx
✅ Documentation mise à jour

PROCHAINES ÉTAPES:
1. Lancer le backend: npm run dev
2. Lancer le frontend: npm run dev
3. Tester avec un scan qui déclenche un CAPTCHA
4. Vérifier:
   - CAPTCHA résolu ✅
   - Attente 90s visible dans les logs ✅
   - 1 annonce fetched (pas de blocage) ✅
   - Message: "Attends 30+ minutes avant de relancer" ✅

DOCUMENTATION À LIRE:
- SOLUTION_RECAP_FR.md: Résumé français complet
- QUICK_START.md: Guide test rapide
- DEPLOYMENT_ULTRA_PRUDENT.md: Guide complet

STATUS: ✅ DÉPLOYÉ ET PRÊT À TESTER
