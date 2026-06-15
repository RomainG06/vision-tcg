WORKFLOW GLOBAL — RADAR DE BONNES AFFAIRES

Objectif de la solution :
Créer un outil qui scrape Leboncoin et Vinted pour détecter automatiquement les annonces intéressantes, sous-évaluées ou mal décrites, en fonction de profils de chasse définis par l’utilisateur.

Le produit ne doit pas être un simple moteur de recherche alternatif.
Il doit être un assistant de détection d’opportunités.

Promesse :
“Je ne te montre pas toutes les annonces. Je te montre celles qui valent potentiellement le coup, avec un score, une estimation, un niveau de risque et une explication claire.”

--------------------------------------------------
1. CONFIGURATION DE LA CHASSE
--------------------------------------------------

L’utilisateur arrive sur l’application et configure une chasse.

Il choisit :

- Univers :
  - Pokémon pour le MVP
  - Prévoir plus tard : Lego, jeux vidéo rétro, sneakers, Magic, Yu-Gi-Oh!, montres, vinyles, etc.

- Profil de chasse :
  - Bonnes affaires Pokémon
  - Wizards FR
  - Lots anciens
  - Carte précise
  - Scellé
  - Opportunités proches
  - Opportunités à revendre
  - Custom

- Bloc / période :
  - Tous
  - Wizards
  - EX
  - Diamant & Perle
  - Noir & Blanc
  - XY
  - Soleil & Lune
  - Épée & Bouclier
  - Écarlate & Violet

- Type d’annonce :
  - Lot
  - Carte seule
  - Scellé
  - Accessoires
  - Tous

- Langue :
  - FR
  - EN
  - JP
  - Toutes

- Filtres :
  - Prix maximum
  - Distance maximum
  - Plateformes : Leboncoin, Vinted
  - Score minimum
  - État minimum si détectable
  - Alertes activées ou non

Exemple :
Profil : Wizards FR
Type : Lot + carte seule
Prix max : 150 €
Distance max : 50 km
Plateformes : Leboncoin + Vinted
Score minimum : 70
Alertes : activées

--------------------------------------------------
2. GÉNÉRATION DES REQUÊTES INTELLIGENTES
--------------------------------------------------

Le système transforme le profil de chasse en plusieurs requêtes intelligentes.

Exemple pour le profil “Wizards FR” :

Mots-clés principaux :
- wizards
- set de base
- jungle
- fossile
- team rocket
- neo genesis
- neo discovery
- neo revelation
- neo destiny
- gym heroes
- gym challenge
- 1999
- 2000
- 2001
- carte pokemon ancienne
- lot pokemon ancien
- cartes pokémon années 2000
- dracaufeu holo
- dracofeu
- florizarre ancien
- tortank ancien
- carte brillante ancienne

Mots-clés négatifs :
- proxy
- fake
- custom
- réplique
- orica
- jumbo
- carte dorée non officielle
- lot récent sans valeur

Le système ne recherche donc pas seulement “Wizards”.
Il lance plusieurs recherches complémentaires pour trouver aussi les annonces mal décrites.

--------------------------------------------------
3. COLLECTE DES ANNONCES
--------------------------------------------------

Le moteur de scraping récupère les annonces sur les plateformes sélectionnées.

Sources MVP :
- Leboncoin
- Vinted

Données récupérées :
- titre
- description
- prix
- URL
- plateforme
- localisation
- distance
- date de publication
- images
- vendeur
- statut de l’annonce
- frais éventuels si disponibles

Si une plateforme demande un captcha :
- l’utilisateur complète la vérification dans la fenêtre ouverte
- la chasse reprend automatiquement après validation

Message UX possible :
“La plateforme demande une vérification. Merci de la compléter dans la fenêtre ouverte. La chasse reprendra automatiquement ensuite.”

Important :
Le scraping est le moteur de collecte.
La vraie valeur du produit vient ensuite : enrichissement, scoring, estimation, alertes.

--------------------------------------------------
4. NORMALISATION DES DONNÉES
--------------------------------------------------

Les annonces Leboncoin et Vinted sont transformées dans un format commun.

Structure normalisée d’une annonce :

Annonce :
- id
- source
- url
- title
- description
- price
- currency
- location
- distance_km
- published_at
- scraped_at
- seller_name
- seller_type
- seller_rating
- images
- status

Objectif :
Pouvoir traiter toutes les annonces de la même manière, peu importe leur plateforme d’origine.
--------------------------------------------------
5. DÉDUPLICATION
--------------------------------------------------

Le système vérifie si plusieurs annonces sont identiques ou très similaires.

Critères possibles :
- même titre ou titre très proche
- même prix
- même vendeur
- mêmes images
- même localisation
- même description
- annonce déjà vue dans l’historique

Résultat :
- éviter les doublons
- détecter les reposts
- suivre les baisses de prix
- identifier les vendeurs qui republient souvent

--------------------------------------------------
6. ENRICHISSEMENT DES ANNONCES
--------------------------------------------------

Chaque annonce brute est analysée pour détecter des signaux.

Signaux positifs :
- Wizards détecté
- lot détecté
- langue FR probable
- holo détecté
- carte ancienne détectée
- prix bas
- vendeur proche
- annonce récente
- titre peu optimisé
- description vague mais prometteuse
- mots-clés rares

Signaux négatifs :
- proxy
- fake
- custom
- jumbo
- mauvais état
- prix trop élevé
- annonce trop ancienne
- vendeur suspect
- photos absentes ou floues
- description incohérente

Champs enrichis :
- detected_block
- detected_language
- detected_type
- detected_keywords
- negative_keywords
- opportunity_signals
- risk_signals
- rarity_level
- liquidity_level
- confidence_score

Exemple :
Titre : “Lot cartes pokemon anciennes”
Prix : 80 €
Description : “Anciennes cartes pokemon de mon enfance”

Signaux détectés :
+ lot
+ ancien
+ potentiel Wizards
+ vendeur probablement non expert
+ prix intéressant
- cartes exactes inconnues
- état non confirmé

--------------------------------------------------
7. ESTIMATION DE VALEUR
--------------------------------------------------

Le système estime une valeur potentielle pour l’annonce.

Pour le MVP, l’estimation peut être approximative.

Sources possibles :
- historique interne des annonces déjà scrapées
- prix moyens observés
- règles métier simples
- base de cartes connues
- fourchettes manuelles par profil
- comparaisons avec annonces similaires

Sortie attendue :
- prix demandé
- valeur estimée basse
- valeur estimée haute
- potentiel de gain
- confiance dans l’estimation

Exemple :
Prix demandé : 80 €
Valeur estimée : 130–220 €
Potentiel : +50 à +140 €
Confiance : moyenne

Important :
L’estimation n’a pas besoin d’être parfaite au début.
Elle doit surtout aider à prioriser les annonces.

--------------------------------------------------
8. CALCUL DU SCORE D’OPPORTUNITÉ
--------------------------------------------------

Chaque annonce reçoit un score sur 100.

Critères possibles :
- pertinence avec le profil de chasse
- présence de mots-clés importants
- absence de mots-clés négatifs
- prix demandé
- écart entre prix demandé et valeur estimée
- fraîcheur de l’annonce
- distance
- rareté potentielle
- liquidité à la revente
- qualité de la description
- qualité des photos
- type de vendeur
- risque d’arnaque
- niveau de confiance

Exemple de pondération MVP :

Pertinence profil : 25 points
Prix intéressant : 25 points
Rareté / valeur potentielle : 15 points
Fraîcheur de l’annonce : 10 points
Distance : 10 points
Qualité / confiance : 10 points
Risque faible : 5 points

Total : 100 points

Niveaux :
- 0 à 39 : normal
- 40 à 59 : intéressant
- 60 à 74 : rare
- 75 à 89 : opportunité forte
- 90 à 100 : opportunité exceptionnelle

--------------------------------------------------
9. EXPLICATION DU SCORE
--------------------------------------------------

Le score doit toujours être explicable.

Exemple :

Score : 87/100

Pourquoi ?
+ Wizards détecté
+ Lot ancien détecté
+ Langue française probable
+ Prix inférieur aux annonces similaires
+ Annonce proche
+ Titre peu optimisé, donc potentiellement sous-évaluée
- Photos moyennes
- État non confirmé

Objectif :
L’utilisateur doit comprendre rapidement pourquoi une annonce remonte.

--------------------------------------------------
10. CLASSEMENT DES ANNONCES
--------------------------------------------------

Les annonces sont triées par priorité.
Ordre recommandé :
1. Opportunités exceptionnelles
2. Opportunités fortes
3. Annonces rares
4. Annonces intéressantes
5. Annonces normales
6. Annonces risquées ou peu pertinentes

Filtres d’affichage :
- score minimum
- prix max
- distance max
- plateforme
- type d’annonce
- bloc
- langue
- niveau de risque
- annonces récentes uniquement
- annonces avec potentiel positif uniquement

--------------------------------------------------
11. AFFICHAGE DANS L’INTERFACE
--------------------------------------------------

L’interface doit être orientée décision.

Exemple de carte annonce :

🔥 Opportunité forte
Score : 87/100

Lot 150 cartes Pokémon Wizards FR
Prix : 80 €
Valeur estimée : 130–220 €
Potentiel : +50 à +140 €
Plateforme : Leboncoin
Distance : 0 km
Publié il y a 12 min

Badges :
WIZARDS · FR · LOT · SOUS-COTÉ · PROCHE

Pourquoi c’est intéressant :
+ Lot Wizards détecté
+ Prix sous marché
+ Proche
+ Titre peu optimisé

Risque : moyen
Action suggérée : contacter rapidement

Boutons :
- Voir l’annonce
- Ajouter à la watchlist
- Ignorer
- Marquer comme contacté

--------------------------------------------------
12. ALERTES INTELLIGENTES
--------------------------------------------------

Le système peut envoyer une alerte seulement si une annonce dépasse certains critères.

Exemples :
- score supérieur à 80
- prix inférieur de 30 % à la valeur estimée
- annonce publiée depuis moins de 10 minutes
- carte rare détectée
- lot ancien proche géographiquement
- profil Wizards FR détecté avec forte confiance
- opportunité exceptionnelle

Canaux possibles :
- notification dans l’application
- email
- Discord
- Telegram
- SMS plus tard

Exemple d’alerte :
“🔥 Opportunité forte détectée : Lot Pokémon Wizards FR à 80 €, valeur estimée 130–220 €, à 5 km.”

--------------------------------------------------
13. WATCHLIST ET SUIVI
--------------------------------------------------

L’utilisateur peut ajouter une annonce à sa watchlist.

Actions possibles :
- sauvegarder
- suivre le prix
- marquer comme contacté
- marquer comme acheté
- marquer comme ignoré
- ajouter une note personnelle

Suivi utile :
- annonce toujours active
- annonce supprimée
- prix modifié
- vendeur a reposté
- annonce déjà vue auparavant

--------------------------------------------------
14. HISTORISATION
--------------------------------------------------

Toutes les annonces importantes sont enregistrées.

Données historisées :
- annonce
- prix initial
- prix actuel
- date de première détection
- date de dernière détection
- statut
- changements de prix
- disparition de l’annonce
- reposts
- vendeur
- score historique
- profil qui l’a détectée

Objectifs :
- créer une base de prix
- améliorer les estimations
- détecter les tendances
- identifier les vendeurs récurrents
- savoir si une annonce est vraiment rare ou non

--------------------------------------------------
15. AMÉLIORATION AVEC L’IA
--------------------------------------------------

Étape avancée, pas obligatoire dans le MVP.

Analyse texte :
- comprendre les descriptions vagues
- détecter les signaux d’opportunité
- détecter les risques
- résumer l’annonce
- générer une explication claire
- suggérer une action

Analyse image :
- détecter cartes Pokémon
- détecter cartes Wizards
- détecter holo
- détecter édition 1
- détecter produits scellés
- détecter cartes rares visibles dans un lot
- détecter état apparent
- détecter fake/proxy potentiel

Exemple :
Une annonce s’appelle “Lot cartes Pokémon enfant”.
L’image montre un Dracaufeu Base Set.
Le système remonte l’annonce comme opportunité forte même si le titre ne contient pas “Dracaufeu”.

--------------------------------------------------
16. ACTIONS UTILISATEUR
--------------------------------------------------

Pour chaque annonce, l’utilisateur peut :

- ouvrir l’annonce originale
- sauvegarder dans la watchlist
- ignorer
- signaler comme faux positif
- marquer comme contacté
- marquer comme acheté
- demander une estimation plus détaillée
- générer un message de contact vendeur
Exemple de message généré :
“Bonjour, votre lot de cartes Pokémon est-il toujours disponible ? Serait-il possible d’avoir quelques photos supplémentaires des cartes brillantes et du dos des cartes ? Merci.”

--------------------------------------------------
17. BOUCLE D’APPRENTISSAGE
--------------------------------------------------

Le système doit s’améliorer avec les retours utilisateur.

Feedbacks possibles :
- bonne opportunité
- faux positif
- trop cher
- mauvais état
- fake/proxy
- déjà vendu
- acheté
- ignoré

Utilisation des feedbacks :
- améliorer le scoring
- ajuster les mots-clés
- réduire les faux positifs
- mieux comprendre les profils
- améliorer les estimations

--------------------------------------------------
18. MVP RECOMMANDÉ
--------------------------------------------------

Version 1 réaliste :

Fonctionnalités indispensables :
1. Scraping Leboncoin + Vinted
2. Profils de chasse simples
3. Requêtes intelligentes par profil
4. Normalisation des annonces
5. Détection de mots-clés positifs/négatifs
6. Score d’opportunité explicable
7. Affichage trié par score
8. Watchlist
9. Historique des annonces vues
10. Alertes simples sur score élevé

À ne pas faire tout de suite :
- estimation parfaite de prix
- analyse d’image avancée
- IA complexe
- marketplace multi-univers
- application mobile native
- système de paiement
- scoring trop sophistiqué
- automatisation excessive des captchas

Objectif MVP :
“Chaque jour, l’utilisateur voit les meilleures annonces Pokémon selon son profil de chasse, avec un score et une explication.”

--------------------------------------------------
19. ROADMAP POSSIBLE
--------------------------------------------------

Phase 1 — MVP
- Scraping
- Profils de chasse
- Score simple
- Interface dashboard
- Watchlist
- Historique

Phase 2 — Scoring avancé
- Estimation de valeur
- Score de risque
- Score de liquidité
- Explication détaillée
- Alertes intelligentes

Phase 3 — Base de marché
- Historique de prix
- Détection des reposts
- Moyennes par type d’objet
- Tendances
- Comparaison avec annonces similaires

Phase 4 — IA
- Analyse des descriptions
- Résumé automatique
- Suggestions d’action
- Message de contact vendeur
- Détection des annonces mal décrites

Phase 5 — Vision par image
- Détection de cartes dans les photos
- Identification des cartes rares
- Détection de lots intéressants
- Détection de fake/proxy potentiel

Phase 6 — Extension
- Lego
- Jeux vidéo rétro
- Sneakers
- Magic
- Yu-Gi-Oh!
- Montres
- Vinyles
- Autres objets de collection

--------------------------------------------------
20. POSITIONNEMENT PRODUIT
--------------------------------------------------

Ne pas positionner l’outil comme :
“Un scraper Leboncoin/Vinted.”

Le positionner comme :
“Un radar de bonnes affaires pour collectionneurs.”

Différence clé :
Les plateformes montrent les annonces.
L’outil détecte les opportunités.

Valeur utilisateur :
- gagner du temps
- voir les bonnes affaires avant les autres
- repérer les annonces mal décrites
- éviter les annonces risquées
- comprendre pourquoi une annonce est intéressante
- suivre les prix
- agir rapidement

Phrase produit possible :
“Configure ta chasse, laisse le radar analyser les marketplaces, et reçois uniquement les opportunités qui valent vraiment le coup.”

C'est la notre bible du moment elle explique le coeur du projet

Oui passe lui le fichier en lui rappelant de le consulter si il a un doute sur le projet
