README — Chasse (Hunting) MVP

But : donner à l'équipe dev un guide court pour démarrer l'implémentation du MVP «profiles de chasse» et s'assurer que le design "hunting" fourni par l'agent design est respecté.

Emplacement projet (canonique) :
- /opt/data/profiles/dev/home/vision-tcg
- Design assets : /opt/data/profiles/dev/home/vision-tcg/design  (respect strict du style "hunting" : tokens, couleurs, cartes décisionnelles)

Branches & PR :
- Workflow : feature/* -> PR -> dev. Petits commits, PRs petites.
- Branche pour ce premier incrément : feature/mvp-step1 (déjà créée). Ne pas merger sans validation Romain.

Commandes utiles (copier/coller)
- Préparation
  cd /opt/data/profiles/dev/home/vision-tcg
  git fetch origin && git checkout feature/mvp-step1 && git pull origin feature/mvp-step1
  npm install

- Seed + dev
  mkdir -p data
  npm run seed
  npm run dev

- Tests rapides
  curl http://localhost:5001/health
  curl http://localhost:5001/api/listings
  curl http://localhost:5001/api/listings/1

Run profile (cron / script)
- Script attendu : /opt/data/profiles/dev/home/vision-tcg/scripts/run_profile.sh
  - doit accepter profile_id (ex: "wizards-fr") ou lire les profiles actifs dans profiles/*.json
  - persister cookies : /opt/data/profiles/dev/home/vision-tcg/data/cookies/<profile>.json
  - exit codes : 0=ok, 2=captcha_required, 3=failed
  - logs : /opt/data/logs/vision-tcg/scrape.log (rotation keep 7)

Cron recommandé (exemple)
- 0 5 * * * /opt/data/profiles/dev/home/vision-tcg/scripts/run_profile.sh wizards-fr >> /opt/data/logs/vision-tcg/scrape.log 2>&1

Design :
- Respect strict du "hunting design" fourni par l'agent design.
- Assets et maquettes sont sous /opt/data/profiles/dev/home/vision-tcg/design. Utilise les tokens, SVGs et classes CSS fournis. Si un composant manque, demande à l'agent design plutôt que d'improviser le style.

Livrables attendus pour ce ticket initial (priorité MVP)
1) Backend : normalizer + listingsRepository + route GET /api/listings (filtrage basique)
2) Script run_profile.sh (cron-ready, gestion CAPTCHA simple)
3) Seed minimal (≥6 annonces mélange LBC/Vinted)
4) Documentation courte (ce README) + checklist de test
5) Respect visuel : intégrer assets design dans le front / preview HMTL

Checklist dev (à cocher et renvoyer)
- [ ] J'ai implémenté et committé sur feature/mvp-step1
- [ ] J'ai poussé la branche origin/feature/mvp-step1
- [ ] J'ai ouvert la PR -> dev (ne pas merger)
- [ ] Les tests unitaires (npm test) passent localement
- [ ] npm run seed insère ≥3 listings et GET /api/listings renvoie des données
- [ ] run_profile.sh gère CAPTCHA (exit 2) et persiste cookies
- [ ] J'ai vérifié le design preview et respecté les assets hunting

Action requise après push
- Envoie un message à Romain ici (Slack/Telegram/hermes) contenant :
  - lien PR
  - résumé du commit (3 lignes max)
  - ETA prochain incrément (heures)

Remarques sécurité & ops
- Ne commite jamais de .env ou clefs API. Utilise .env.local et /opt/secrets si besoin.
- Cookies et fichiers sensibles : permissions restreintes (chmod 600)

Merci — implémentez en petits incréments et prévenez moi dès ouverture PR pour que Romain valide le design et le comportement.
