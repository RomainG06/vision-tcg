# 📋 RÉCAPITULATIF — MVP Hunting Dashboard UI/UX

**Date** : Juin 2026  
**Projet** : Vision TCG - Radar de bonnes affaires Pokémon  
**Design System** : Hunting Dashboard  
**Statut** : ✅ Spécifications complètes

---

## 🎯 Vue d'ensemble

Ce document récapitule les spécifications UI/UX pour les **3 écrans manquants** du MVP Hunting Dashboard.

### Écrans spécifiés
1. **Modal Détail Annonce** (`MODAL_DETAIL.md`) — ⭐️⭐️⭐️ HAUTE priorité
2. **Configuration Chasse** (`CONFIG_CHASSE.md`) — ⭐️⭐️ MOYENNE priorité
3. **Lancement Scan** (`SCAN_PROGRESS.md`) — ⭐️ BASSE priorité

---

## 📐 Wireframes ASCII

### 1. Modal Détail Annonce (overlay full-screen)
```
┌─────────────────────────────────────────────┐
│  [Modal Overlay + backdrop blur]      [✕]  │
│  ┌───────────────────────────────────────┐  │
│  │  💎 OPPORTUNITÉ EXCEPTIONNELLE    87  │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  Lot 150 cartes Pokémon Wizards FR   │  │
│  │  [IMAGE ou 🎴]                        │  │
│  │  Prix: 80 € | Estimé: 130-220 €      │  │
│  │  📍 Nice · 0 km                       │  │
│  │  ✨ POURQUOI C'EST INTÉRESSANT        │  │
│  │  + Wizards détecté                    │  │
│  │  + Prix sous marché                   │  │
│  │  + Proche                             │  │
│  │  [WIZARDS][FR][LOT][SOUS-COTÉ]       │  │
│  │  📊 ANALYSE DÉTAILLÉE (markdown)      │  │
│  │  📝 Description vendeur               │  │
│  │  ℹ️  Métadonnées                      │  │
│  │  [🔗 Voir annonce] [⭐ Watchlist]     │  │
│  │  [❌ Ignorer] [⚡ Marquer contacté]   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 2. Configuration Chasse (formulaire multi-sections)
```
┌─────────────────────────────────────────────┐
│  🎯 CONFIGURATION DE CHASSE                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  1️⃣ PROFIL: [Dropdown: Wizards FR ▼]      │
│  2️⃣ CRITÈRES:                              │
│     Bloc: [Tous ▼]                         │
│     Type: [✓] Lot [✓] Carte [ ] Scellé    │
│     Langue: (•) FR ( ) EN ( ) JP           │
│  3️⃣ FILTRES AVANCÉS:                       │
│     Prix max: [150] €                      │
│     Distance: ├───○───┤ 50 km             │
│     Score min: ├──────○──┤ 70/100         │
│  4️⃣ PLATEFORMES:                           │
│     [✓] Leboncoin [✓] Vinted              │
│  5️⃣ ALERTES: [●─────] ON                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [Annuler]    [🎯 LANCER LA CHASSE]       │
└─────────────────────────────────────────────┘
```

### 3. Lancement Scan (progression centrée)
```
┌─────────────────────────────────────────────┐
│              🎯 CHASSE EN COURS             │
│  ┌───────────────────────────────────────┐  │
│  │  [████████░░░░░░░░░░░░░]  65%        │  │
│  └───────────────────────────────────────┘  │
│  ✓ Recherche Leboncoin (23 annonces)      │
│  ⚡ Recherche Vinted...                    │
│  ⏳ Analyse en cours...                    │
│  ⏸  Calcul des scores...                  │
│              [Annuler]                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           ✅ CHASSE TERMINÉE !              │
│       12 opportunités détectées             │
│  ┌───────────────────────────────────────┐  │
│  │  🔥 3 opportunités fortes             │  │
│  │  ⭐ 5 opportunités intéressantes      │  │
│  │  ◆ 4 opportunités normales            │  │
│  └───────────────────────────────────────┘  │
│  💰 Gain: +450€ - +890€ | ⚡ 12s          │
│       [🎯 Voir les opportunités]           │
│       Redirection dans 3s...               │
└─────────────────────────────────────────────┘
```

---

## 🎨 Design System (rappel)

### Couleurs principales
- **Obsidian** `#0A0E27` — Background principal
- **Midnight** `#121633` — Surfaces élevées
- **Deep Dark** `#1A1F3A` — Cards background
- **Hunter Gold** `#E6B85C` — Accents primaires
- **Mana Cyan** `#00D9FF` — Highlights énergétiques
- **Success Green** `#10B981` — Confirmations
- **Prey Red** `#FF1744` — Alertes, danger

### Rarity Colors (score-based)
- **Mythique** (90-100) : `#FF1744` + pulse glow
- **Legendary** (75-89) : `#FFD700` + gold glow
- **Epic** (60-74) : `#0EA5E9` + cyan glow
- **Rare** (40-59) : `#7C3AED` + purple glow
- **Common** (0-39) : `#4B5563` (gris)

### Typography
- **Font primary** : Inter, -apple-system, sans-serif
- **Font heading** : Outfit, Inter, sans-serif
- **Font mono** : JetBrains Mono

### Spacing Scale
- xs: `4px`, sm: `8px`, md: `12px`, lg: `16px`
- xl: `24px`, xxl: `32px`, xxxl: `48px`

### Shadows & Glow
- sm: `0 1px 2px rgba(0,0,0,0.5)`
- md: `0 4px 12px rgba(0,0,0,0.6)`
- lg: `0 8px 24px rgba(0,0,0,0.7)`
- xl: `0 16px 32px rgba(0,0,0,0.8)`
- glowLegendary: `0 0 20px rgba(255,215,0,0.3)`

---

## 🧩 Nouveaux Composants à Créer

### Modal Détail
- ✅ `LotDetail.jsx` (amélioration existant)
- 🆕 `MarkdownExplanation.jsx` (rendering react-markdown)

### Configuration Chasse
- 🆕 `HuntConfig.jsx` (formulaire principal)
- 🆕 `Slider.jsx` (slider custom avec glow)
- 🆕 `Toggle.jsx` (toggle switch animé)
- 🆕 `RadioGroup.jsx` (optionnel, peut être inline)

### Lancement Scan
- 🆕 `ScanProgress.jsx` (écran progression)
- 🆕 `ProgressBar.jsx` (barre avec shine animation)
- 🆕 `ScanStep.jsx` (étape avec status icon)

---

## 📦 Dépendances NPM

```json
{
  "dependencies": {
    "react-markdown": "^9.0.1"
  }
}
```

**Installation** :
```bash
cd /opt/data/profiles/dev/home/vision-tcg/frontend
npm install react-markdown
```

---

## 📱 Responsive Breakpoints (tous écrans)

### Desktop (1440px)
- Modal: `900px` max-width
- Config form: `900px` max-width
- Scan progress: `700px` max-width
- Actions grid: 2-3 colonnes
- Font sizes: standard

### Tablet (768px)
- Modal: `90vw` width
- Forms: `90vw` width
- Actions grid: 1-2 colonnes
- Padding réduit: `theme.spacing.lg`

### Mobile (375px)
- Modal: full-screen ou `100vw`
- Forms: full-screen
- Actions grid: 1 colonne (stack)
- Padding réduit: `theme.spacing.md`
- Font sizes: -10% à -15%

---

## ♿ Accessibilité (tous écrans)

### Keyboard Navigation
- **ESC** : fermer modal / annuler action
- **Tab** : navigation séquentielle focus
- **Enter/Space** : activer bouton/toggle/checkbox
- **Arrow keys** : ajuster sliders

### ARIA Labels
- `role="dialog"` sur modal
- `role="progressbar"` sur progress bar
- `aria-live="polite"` sur status messages
- `aria-label` sur tous boutons icon-only
- `aria-describedby` pour helper texts

### Focus Management
- Auto-focus sur élément principal à l'ouverture
- Trap focus dans modal (no escape with Tab)
- Restore focus après fermeture
- Visible focus states (outline cyan glow)

---

## 🎬 Animations Clés

### Modal Détail
- **Fade-in** backdrop (0 → 0.85 opacity, 300ms)
- **Scale-up** modal (0.9 → 1.0, 400ms ease-out)
- **Hover** buttons (translateY -3px, 200ms)

### Configuration Chasse
- **Slider thumb** scale on drag (1.0 → 1.2)
- **Toggle switch** smooth slide (300ms ease)
- **Submit button** glow pulse on hover

### Lancement Scan
- **Hunt-pulse** icon (scale 1.0 → 1.05, 2s loop)
- **Radar-sweep** icon rotation (360deg, 3s loop)
- **Shine** progress bar (translateX -100% → 200%, 2s loop)
- **Bounce** success icon (scale 1.0 → 1.2 → 1.0, 600ms)

---

## 🔄 Flow Utilisateur Complet

```
Dashboard 
  ↓ clic carte listing
[Modal Détail Annonce]
  → Voir annonce (ouvre Leboncoin/Vinted)
  → Watchlist (MAJ status → ferme modal)
  → Ignorer (MAJ status → ferme modal)
  → Marquer contacté (MAJ status → toast → ferme modal)
  ↓ ESC ou [✕]
Dashboard

Dashboard header
  ↓ clic "🎯 Nouvelle Chasse"
[Configuration Chasse]
  → Remplir formulaire (profil, critères, filtres)
  → Validation inline
  ↓ clic "🎯 Lancer la chasse"
[Lancement Scan]
  → Progression étapes (Leboncoin → Vinted → Analyze → Score → Filter)
  → Auto-redirect après 3s
  ↓ ou clic "Voir opportunités"
Dashboard (avec résultats)
```

---

## 🐛 Gestion Erreurs

### Modal Détail
- **Image non chargée** : placeholder 🎴 + gradient
- **Explication vide** : cacher section
- **API update failed** : alert() + console.error

### Configuration Chasse
- **Validation échouée** : messages inline rouges
- **Aucun type sélectionné** : "Sélectionnez au moins un type"
- **Aucune plateforme** : "Sélectionnez au moins une plateforme"
- **Prix invalide** : "Prix doit être entre 1 et 10000 €"

### Lancement Scan
- **Fetch timeout** : retry automatique 1x
- **API error 500** : afficher error state avec bouton "Réessayer"
- **Annulation user** : cancelled state → retour config

---

## 📊 Données Backend Attendues

### Modal Détail (GET /api/listings/:id)
```json
{
  "id": 123,
  "title": "Lot 150 cartes Pokémon Wizards FR",
  "score": 87,
  "price": 80,
  "value_estimate_low": 130,
  "value_estimate_high": 220,
  "gain_potential": 140,
  "gain_percentage": 88,
  "confidence": "moyenne",
  "images": "https://...",
  "location": "Nice, Alpes-Maritimes",
  "distance_km": 0,
  "source": "leboncoin",
  "url": "https://...",
  "description": "Lot de cartes...",
  "explanation": "**Pertinence profil**: Wizards FR...",
  "opportunity_signals": ["wizards_detected", "french_edition", "below_market"],
  "risk_signals": ["condition_unclear", "incomplete_photos"],
  "posted_at": "2026-06-15T10:30:00Z",
  "status": "new"
}
```

### Configuration Chasse (POST /api/hunts/start)
```json
{
  "profile": "wizards_fr",
  "block": "wizards",
  "types": ["lot", "single_card"],
  "language": "fr",
  "maxPrice": 150,
  "maxDistance": 50,
  "minScore": 70,
  "platforms": ["leboncoin", "vinted"],
  "alertsEnabled": true
}
```

**Réponse** :
```json
{
  "huntId": "abc123",
  "status": "started"
}
```

### Lancement Scan (WebSocket ou Polling)

**WebSocket events** (préféré) :
```json
// Event: scan.progress
{
  "huntId": "abc123",
  "step": "leboncoin",
  "progress": 20,
  "count": 23,
  "status": "completed"
}

// Event: scan.completed
{
  "huntId": "abc123",
  "totalListings": 37,
  "opportunities": [
    { "level": "strong", "count": 3 },
    { "level": "interesting", "count": 5 },
    { "level": "normal", "count": 4 }
  ],
  "meta": {
    "gainPotentialMin": 450,
    "gainPotentialMax": 890,
    "scanDuration": 12
  }
}
```

**Polling alternative** (GET `/api/hunts/:id/status`) :
```json
{
  "huntId": "abc123",
  "status": "scanning", // scanning | completed | error
  "currentStep": "vinted",
  "progress": 60,
  "steps": [
    { "id": "leboncoin", "status": "completed", "count": 23 },
    { "id": "vinted", "status": "active", "count": 14 },
    { "id": "analyze", "status": "pending", "count": 0 }
  ]
}
```

---

## ✅ Checklist Globale d'Implémentation

### Phase 1 : Modal Détail (priorité haute)
- [ ] Installer `react-markdown`
- [ ] Créer `MarkdownExplanation.jsx`
- [ ] Améliorer `LotDetail.jsx` existant
- [ ] Ajouter section "Pourquoi c'est intéressant"
- [ ] Intégrer markdown rendering
- [ ] Ajouter bouton "Marquer contacté"
- [ ] Tester responsive mobile/tablet
- [ ] Valider keyboard nav + ARIA
- [ ] Tester toutes les rarity (common → mythique)

### Phase 2 : Configuration Chasse (priorité moyenne)
- [ ] Créer `HuntConfig.jsx`
- [ ] Créer `Slider.jsx`
- [ ] Créer `Toggle.jsx`
- [ ] Implémenter presets profils
- [ ] Implémenter validation formulaire
- [ ] Connecter POST `/api/hunts/start`
- [ ] Tester responsive mobile/tablet
- [ ] Valider keyboard nav + ARIA
- [ ] Tester erreurs validation

### Phase 3 : Lancement Scan (priorité basse)
- [ ] Créer `ScanProgress.jsx`
- [ ] Créer `ProgressBar.jsx`
- [ ] Créer `ScanStep.jsx`
- [ ] Implémenter WebSocket listener (ou polling)
- [ ] Implémenter annulation scan
- [ ] Implémenter auto-redirect countdown
- [ ] Ajouter animations (pulse, radar, shine)
- [ ] Tester responsive mobile/tablet
- [ ] Tester error state + retry
- [ ] Valider transitions états

### Tests d'intégration
- [ ] Flow complet Dashboard → Config → Scan → Dashboard
- [ ] Modal ouvre/ferme sans memory leaks
- [ ] Formulaire persiste valeurs en cas de back
- [ ] Auto-redirect fonctionne correctement
- [ ] Toasts notifications s'affichent
- [ ] API errors gérées gracefully

---

## 📝 Notes d'Implémentation

### Inline Styles vs CSS Modules
✅ **Utiliser inline styles uniquement** (contrainte projet)
- Tous les styles via objects JavaScript
- Importer `theme.js` pour tokens
- Pas de CSS externe, Tailwind, ou styled-components

### State Management
- **useState** pour états locaux composants
- **useEffect** pour side effects (fetch, timers)
- Pas de Redux/Zustand nécessaire pour MVP

### Performance
- Éviter re-renders inutiles avec `React.memo` si nécessaire
- Cleanup timers/intervals dans `useEffect` return
- Lazy load images avec placeholder

### Testing
- Tests unitaires avec Jest + React Testing Library
- Focus sur interactions utilisateur (click, hover, keyboard)
- Snapshot tests pour styles critiques

---

## 🚀 Prochaines Étapes Recommandées

1. **Commencer par Modal Détail** (impact UX immédiat)
2. **Tester avec vraies données API** (mock au début)
3. **Valider design avec screenshot validé Dashboard**
4. **Implémenter Config Chasse** (unlock fonctionnalité scan)
5. **Implémenter Scan Progress** (polish UX)
6. **Tests end-to-end** complet flow
7. **Optimisations performances** si nécessaire
8. **Documentation composants** (Storybook optionnel)

---

## 📚 Fichiers Générés

```
/opt/data/profiles/dev/home/vision-tcg/design/
├── MODAL_DETAIL.md          ← Modal détail annonce
├── CONFIG_CHASSE.md         ← Formulaire configuration
├── SCAN_PROGRESS.md         ← Écran progression scan
└── RECAP_MVP_SCREENS.md     ← Ce fichier (récapitulatif)
```

---

**Créé le** : 15 juin 2026  
**Statut** : ✅ Prêt pour implémentation  
**Design cohérent** : ✅ Validé avec Dashboard existant  
**Accessibilité** : ✅ ARIA + keyboard nav spécifiés  
**Responsive** : ✅ Mobile/tablet/desktop couverts  

---

**Bon développement ! 🎯**
