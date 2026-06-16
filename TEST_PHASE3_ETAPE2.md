# 🧪 Phase 3 Étape 2 - Instructions de test Windows

**Date** : 2026-06-16  
**Branch** : `feature/ui-hunting-radar`  
**Commit** : `a51a7fb` (LotDetailModal)

---

## 📦 **PRÉREQUIS**

- ✅ Git configuré avec GitHub token
- ✅ Node.js v22+ installé
- ✅ Frontend déjà testé localement (Étape 1 validée)

---

## 🚀 **INSTRUCTIONS WINDOWS**

### **1. Récupérer les dernières modifications**

```powershell
cd D:\Developpement\vision-tcg
git fetch origin
git checkout feature/ui-hunting-radar
git pull origin feature/ui-hunting-radar
```

**Commit attendu** : `8cb4201` (docs: update Phase 3 status)  
**Fichiers modifiés** : 
- `frontend/src/components/LotDetailModal.jsx` (NEW, 707 lines)
- `frontend/src/components/LotList.jsx` (import LotDetailModal)
- `frontend/package.json` (+ react-markdown@10.1.0)
- `PHASE3_STATUS.md` (updated progress)

---

### **2. Installer dépendances**

```powershell
cd frontend
npm install
```

**Vérifications** :
- ✅ `react-markdown@10.1.0` doit apparaître dans les logs
- ✅ Pas d'erreurs `ERESOLVE`

---

### **3. Lancer le serveur de développement**

```powershell
npm run dev
```

**Attendu** :
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## ✅ **TESTS À EFFECTUER**

### **TEST 1 : Ouverture Modal**
1. Ouvrir http://localhost:5173 dans le navigateur
2. Si aucune annonce affichée → utiliser les filtres pour voir des résultats
3. **Cliquer sur une carte listing**
4. **Vérifier** : Modal s'affiche par-dessus avec backdrop blur

**Résultat attendu** :
- ✅ Overlay semi-transparent noir avec blur
- ✅ Modal centrée (max 1200px × 90vh)
- ✅ Border gold glow (#E6B85C)
- ✅ Backdrop cliquable (ferme la modal)

---

### **TEST 2 : Header Modal**
**Vérifier** :
- ✅ Bouton X (top-left, hover red)
- ✅ Titre "🎯 OPPORTUNITÉ DÉTECTÉE" (uppercase, gold glow)
- ✅ Badge "Score: XX" (gradient gold→cyan, top-right)

---

### **TEST 3 : Image Carousel**
**Vérifier** :
- ✅ Image principale affichée (400×400px, object-fit: contain)
- ✅ Si plusieurs images (listing.images.length > 1) :
  - Boutons ◀ ▶ visibles en hover
  - Indicator "1 / 3" centré en bas
  - Thumbnails (4 max) en dessous, active border cyan
  - Clic thumbnail → change main image

**Keyboard Test** :
- ✅ **ArrowLeft** → image précédente
- ✅ **ArrowRight** → image suivante
- ✅ Indicator mis à jour "2 / 3"

---

### **TEST 4 : Prix + Estimation Block**
**Vérifier** :
- ✅ Titre listing (h3, gold glow)
- ✅ **Prix annoncé** : XXX € (xxlarge, gold, text-shadow)
- ✅ **Estimation** : XX–YYY € (xlarge, cyan)
- ✅ **Potentiel de gain** : +XX à +YYY € (green si positif, red si négatif)
- ✅ **Badges opportunités** (6 max) : 🔥 WIZARDS, 🇫🇷 FR, etc.

---

### **TEST 5 : Détails Annonce (Section 📍)**
**Vérifier** :
- ✅ Grid 2 colonnes (label: value)
- ✅ **Plateforme** : Leboncoin / Vinted
- ✅ **Publié** : date ou "Récemment"
- ✅ **Localisation** : Ville • XX km de vous (green si < 20km)
- ✅ **État** : Bon état / Non précisé
- ✅ **Vendeur** : Particulier / Pro

---

### **TEST 6 : Section "Pourquoi c'est intéressant" (✨)**
**Vérifier** :
- ✅ Border gold (2px)
- ✅ Titre highlighted avec glow
- ✅ **Markdown rendering** :
  - Paragraphes avec line-height 1.6
  - **Mots en gras** (strong) en gold
  - Listes (ul/li) sans bullet, padding-left
- ✅ Contenu depuis `listing.explanation` (backend signal-detector)

**Test markdown** : Si explanation contient `**WIZARDS détectés**` → doit être en **gold bold**

---

### **TEST 7 : Section Évaluation (📊)**
**Vérifier** :
- ✅ **Risque** : FAIBLE / MOYEN / ÉLEVÉ avec dots ●●○ (color-coded)
- ✅ **Confiance** : XX% avec dots (green si >70%, gold si 50-70%, red si <50%)
- ✅ **Compétition** : FAIBLE (XX vues)
- ✅ **Action suggérée** : "⚡ Contacter rapidement" (gold glow, border top)

---

### **TEST 8 : Footer Actions (4 boutons)**
**Vérifier** :
1. **🔗 Voir l'annonce** (primary, gradient gold→cyan)
   - ✅ Clic → ouvre `listing.url` dans nouvel onglet
   
2. **⭐ Watchlist** (secondary, border cyan)
   - ✅ Clic → alert "✅ Ajouté à la watchlist !"
   - ✅ Console : POST `/api/listings/:id/watchlist` (peut échouer si backend pas running)

3. **❌ Ignorer** (tertiary, border slate)
   - ✅ Clic → alert "Annonce ignorée"
   - ✅ Modal se ferme
   - ✅ Console : PATCH `/api/listings/:id/status` {status: 'ignored'}

4. **✅ Contacté** (success, border green)
   - ✅ Clic → alert "✅ Marqué comme contacté !"
   - ✅ Modal se ferme
   - ✅ Console : PATCH `/api/listings/:id/status` {status: 'contacted'}

---

### **TEST 9 : Keyboard Navigation**
**Vérifier** :
- ✅ **Escape** → ferme la modal
- ✅ **Tab** → focus trap (ne sort pas de la modal)
- ✅ **ArrowLeft / ArrowRight** → change l'image carousel
- ✅ **Enter** sur bouton focusé → déclenche l'action

---

### **TEST 10 : Responsive (DevTools)**
1. Ouvrir DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Tester 3 breakpoints :

#### **Mobile (375×667 iPhone SE)**
- ✅ Modal fullscreen (100vw × 100vh - 32px padding)
- ✅ Image carousel : portrait (full width)
- ✅ Prix + Estimation : stacked vertical
- ✅ Footer buttons : 2×2 grid ou stacked
- ✅ Text lisible (min 14px)

#### **Tablet (768×1024 iPad)**
- ✅ Modal 90vw × 90vh
- ✅ Image + Prix : side-by-side (grid 2 colonnes)
- ✅ Footer buttons : 4 colonnes grid

#### **Desktop (1440×900)**
- ✅ Modal max 1200px width
- ✅ Layout optimal (comme spécifié)

---

## 🐛 **PROBLÈMES CONNUS (ATTENDUS)**

### **1. Backend pas running → Erreurs API**
**Symptôme** : Actions (Watchlist, Ignorer, Contacté) → alert "❌ Erreur : fetch failed"

**Cause** : Backend Express pas démarré sur port 3001

**Fix temporaire** : Ignorer (modal fonctionne, juste actions désactivées)

**Fix permanent** :
```powershell
# Terminal 2
cd D:\Developpement\vision-tcg\backend
npm start
# Attend "Server running on http://localhost:3001"
```

---

### **2. Listing sans images → Placeholder**
**Symptôme** : Image affiche "Image non disponible"

**Cause** : `listing.images` vide ou URL cassée

**Attendu** : Fallback vers `https://via.placeholder.com/400?text=Image+non+disponible`

---

### **3. Explanation vide → Section masquée**
**Symptôme** : Section "Pourquoi c'est intéressant" absente

**Cause** : `listing.explanation` null/undefined

**Attendu** : Comportement correct (section conditionnelle avec `{listing.explanation && ...}`)

---

## 📸 **CAPTURES D'ÉCRAN DEMANDÉES**

**Pour validation complète, envoyer 3 screenshots** :

1. **Modal ouverte - Vue d'ensemble** (full modal avec header + body + footer visible)
2. **Section Markdown** (zoom sur "Pourquoi c'est intéressant" avec bold en gold)
3. **Footer Actions** (4 boutons avec hover state sur "Voir l'annonce")

**Upload sur** : Telegram ou Discord (chat DevFullstack-Poké)

---

## ✅ **VALIDATION RÉUSSIE SI**

- [ ] Modal s'ouvre au clic sur carte
- [ ] Escape ferme la modal
- [ ] Carousel fonctionne (arrows, thumbnails)
- [ ] Prix + estimation + gain affichés
- [ ] Badges opportunités visibles
- [ ] Markdown rendering OK (bold en gold)
- [ ] 4 boutons actions présents
- [ ] Design hunting cohérent (gold, cyan, obsidian)

---

## 📝 **APRÈS TEST**

**Commenter dans le chat** :
```
✅ Phase 3 Étape 2 validée Windows
- Modal OK
- Keyboard nav OK
- Carousel OK
- Actions [OK/KO - préciser si backend running]
- Screenshots envoyés

Prêt pour Étape 3 (responsive + polish)
```

Ou signaler tout problème bloquant avec :
- Message d'erreur console (F12)
- Screenshot du problème
- Étape où ça bloque

---

**Bon test !** 🚀
