Projet: pokemon-scraper (lots Wizards)

But
Automatiser la recherche d'annonces (lots de cartes Pokémon du bloc Wizards) sur eBay.fr, Leboncoin, Vinted et Facebook Marketplace.

État actuel
- Prototype headless Puppeteer + stealth qui collecte des liens via Bing et tente d'extraire informations simples depuis les pages (titre, prix, localisation, indication "édition française", nombre de cartes si indiqué).
- Protection anti-bot (DataDome / CAPTCHA / Error Pages) détectée sur plusieurs sites. Le scraper fonctionne mais renvoie 0 résultats exhaustifs sans proxies résidents ou authentification.

Arborescence
- scraper.js         : script principal (puppeteer-extra + stealth) qui parcourt Bing, visite les pages et extrait informations.
- package.json       : dépendances listées (puppeteer-extra, puppeteer-extra-plugin-stealth, puppeteer optionnel)
- .env.example       : variables d'environnement à renseigner (EBAY_APP_ID, CHROMIUM_PATH, etc.)
- run.sh             : wrapper d'exécution (exemple)

Installation (sur le VPS)
1) Node.js (v20+) installé. Exemple (déjà installé sur cet environnement): /tmp/node-v20.20.2-linux-x64/bin/node
2) Installer les dépendances dans le dossier du projet (depuis le projet):
   PUPPETEER_SKIP_DOWNLOAD=1 /tmp/node-v20.20.2-linux-x64/bin/npm install --prefix /opt/data/pokemon-scraper
   - PUPPETEER_SKIP_DOWNLOAD=1 empêche Puppeteer de retélécharger Chromium si tu souhaites utiliser le binaire système (/usr/bin/chromium).
3) Lancer le scraper (exemple):
   /tmp/node-v20.20.2-linux-x64/bin/node /opt/data/pokemon-scraper/scraper.js

Utilisation et configuration
- Le script lit ces variables d'environnement (ou utilise les valeurs par défaut):
  - CHROMIUM_PATH : chemin vers le binaire Chromium (par défaut: /usr/bin/chromium)
  - SEARCH_RADIUS  : rayon pour les recherches locales (non utilisé automatiquement par Bing, mais indiqué)
  - EBAY_APP_ID    : App ID eBay (production pour accès API, facultatif)

Sécurité et clés
- Ne met pas de clés sensibles directement dans les fichiers du projet. Utilise des variables d'environnement ou un gestionnaire de secrets.
- Ce dépôt prototype ne contient pas d'App ID / secrets. Le fichier .env.example montre le format.

Améliorations possibles
- Intégration via l'API eBay (Production AppID + OAuth) pour lister les vraies annonces de façon fiable.
- Utilisation d'un proxy résidentiel pour diminuer les blocages anti-bot.
- Ajout d'un cache / base de données (SQLite) pour historique et déduplication.
- Extraction plus fiable des photos et calcul €/carte.

Fichiers générés par l'automatisation (exemples)
- /tmp/auto_results.json
- /tmp/search_results.json
- /tmp/lbc_scrape.html

Si tu veux, je peux:
- Committer ce dossier dans un dépôt Git local (/opt/data/pokemon-scraper/.git) et te fournir la commande pour le cloner ailleurs.
- Pousser vers un repo distant si tu me fournis un accès (ou je te fournis un patch).

Dis-moi la prochaine étape :
- Je lance une passe de test avec ta clef Sandbox (utile pour vérifier le pipeline mais pas pour obtenir des annonces live),
- Ou tu fournis la AppID Production et/ou un proxy résidentiel pour lancer la collecte réelle et livrer la sélection (top 8–12 annonces) automatiquement.
