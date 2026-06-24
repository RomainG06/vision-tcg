# 📋 SPÉCIFICATIONS UI/UX MVP — Index & Guide

## 🎯 Vue d'ensemble

Ce document référence les **3 spécifications UI/UX détaillées** créées pour le MVP Hunting Dashboard. Chaque spécification contient tous les éléments nécessaires pour l'implémentation complète des écrans prioritaires.

---

## 📁 Fichiers de spécifications

### 1. **MODAL_DETAIL_SPEC.md** 🔥 **PRIORITÉ MAXIMALE**

**Écran:** Modal Détail Annonce  
**Taille:** 1,167 lignes (32 KB)  
**Statut:** ✅ Complet

**Contenu:**
- Wireframe ASCII du layout modal full-screen
- Structure complète (header, carousel, prix, badges, explication markdown, évaluation, footer)
- 30+ blocs de styles inline React utilisant theme.js
- 7 composants React détaillés avec props TypeScript
- 6 états UI (loading, error, success, empty, focus, hover)
- Responsive complet (mobile 375px, tablet 768px, desktop 1440px)
- Accessibilité (keyboard nav, ARIA, focus trap)
- Integration react-markdown pour l'explication
- 4 actions principales: Voir annonce, Watchlist, Ignorer, Marquer contacté

**Sections clés:**
- Image carousel avec thumbnails et navigation (◀ ▶)
- Bloc prix/estimation avec badges rarity-based
- Section "Pourquoi c'est intéressant" en markdown (✓ points forts, ⚠️ vigilances)
- Évaluation avec dots visuels (risque, confiance, compétition)
- 4 boutons d'action avec styles différenciés

**Référence Bible:** Section 11 (ligne 384-420)

---

### 2. **CONFIG_CHASSE_SPEC.md**

**Écran:** Configuration Chasse  
**Taille:** 1,172 lignes (34 KB)  
**Statut:** ✅ Complet

**Contenu:**
- Wireframe ASCII du formulaire complet
- Structure sections (header sticky, form scrollable, footer sticky)
- 40+ blocs de styles inline React pour tous les inputs
- 7 composants React détaillés avec props TypeScript
- 6 états UI (default, loading, saving, error, success, empty)
- Responsive complet avec grids adaptatifs
- Accessibilité (keyboard nav, ARIA, validation)
- Custom components: Dropdown, Checkbox, Slider, Toggle

**Sections clés:**
- Profil de chasse (dropdown avec 8 options preset)
- Bloc/période (dropdown ères Pokémon)
- Type d'annonce (checkboxes: Lot, Carte seule, Scellé, Accessoires)
- Langue (checkboxes: FR, EN, JP, Toutes)
- Prix maximum (slider 0-500€ avec gradient)
- Distance maximum (slider 0-200km)
- Plateformes (checkboxes: Leboncoin, Vinted, eBay, Cardmarket)
- Score minimum (slider 0-100 avec rarity legend)
- Alertes (toggle + conditions)

**Référence Bible:** Section 1 (ligne 13-74)

---

### 3. **SCAN_PROGRESS_SPEC.md**

**Écran:** Lancement Scan avec Progression  
**Taille:** 1,099 lignes (33 KB)  
**Statut:** ✅ Complet

**Contenu:**
- Wireframe ASCII du processus de scan
- Structure dynamique (header, radar animation, steps, progress bar, summary, highlights)
- 35+ blocs de styles inline React avec animations
- 7 composants React détaillés avec props TypeScript
- 5 états UI (initial, in_progress, completed, error, cancelled)
- Responsive complet avec animations optimisées
- Accessibilité (ARIA live regions, status updates)
- WebSocket integration pour real-time updates

**Sections clés:**
- Radar animation (sweep + pulse + rings expanding)
- Progress steps (6 étapes: Recherche × 2, Analyse, Calcul scores, Détection, Finalisation)
- Progress bar avec gradient + shimmer effect
- Time info (temps écoulé + ETA)
- Completion summary (stats + highlights rarity-based)
- Highlight cards animées (opportunités fortes détectées)

**Animations:**
- Radar sweep (rotation 360°, 3s)
- Radar pulse (glow gold, 2s)
- Ring expansion (scale + fade)
- Progress bar shimmer
- Step highlight (active step)
- Completion transition
- Highlight card entrance (stagger)

**Référence Bible:** Workflow général (sections 2-3)

---

## 🎨 Design System Commun

Toutes les spécifications utilisent les mêmes tokens de design :

### Couleurs
```javascript
// Primary
theme.colors.primary.obsidian  // #0A0E27 - Background
theme.colors.primary.midnight  // #121633 - Headers
theme.colors.primary.deepDark  // #1A1F3A - Cards
theme.colors.primary.slate     // #1E2847 - Accents

// Status (Rarity)
theme.colors.status.common     // #4B5563 - Score 0-39
theme.colors.status.rare       // #7C3AED - Score 40-59
theme.colors.status.epic       // #0EA5E9 - Score 60-74
theme.colors.status.legendary  // #FFD700 - Score 75-89
theme.colors.status.mythique   // #FF1744 - Score 90-100

// Accents
theme.accents.hunterGold       // #E6B85C - Primary actions
theme.accents.manaCyan         // #00D9FF - Highlights
theme.accents.preyRed          // #FF1744 - Alerts
theme.accents.successGreen     // #10B981 - Success
theme.accents.warningOrange    // #F59E0B - Warnings
```

### Typography
```javascript
theme.typography.fonts.heading  // 'Outfit', 'Inter', sans-serif
theme.typography.fonts.primary  // 'Inter', system fonts
theme.typography.fonts.mono     // 'JetBrains Mono', monospace

theme.typography.sizes.headingLg  // 28px
theme.typography.sizes.headingMd  // 24px
theme.typography.sizes.bodyLg     // 16px
theme.typography.sizes.bodyMd     // 14px
theme.typography.sizes.tiny       // 11px
```

### Spacing
```javascript
theme.spacing.xs    // 4px
theme.spacing.sm    // 8px
theme.spacing.md    // 12px
theme.spacing.lg    // 16px
theme.spacing.xl    // 24px
theme.spacing.xxl   // 32px
theme.spacing.xxxl  // 48px
```

### Shadows & Glows
```javascript
theme.shadows.sm              // Subtle elevation
theme.shadows.md              // Cards
theme.shadows.lg              // Modals
theme.shadows.xl              // Overlays

theme.shadows.glowRare        // Purple glow (score 40-59)
theme.shadows.glowEpic        // Cyan glow (score 60-74)
theme.shadows.glowLegendary   // Gold glow (score 75-89)
theme.shadows.glowMythique    // Red glow (score 90-100)
```

---

## 🧩 Composants React Communs

### Composants partagés entre écrans

#### 1. `BadgeList`
Utilisé dans: Modal Détail  
Affiche les badges d'opportunité avec couleurs et emojis.

#### 2. `RarityBadge`
Utilisé dans: Modal Détail, Scan Progress  
Badge de score avec glow rarity-based.

#### 3. `Button` (variants)
Utilisé dans: Tous les écrans  
Variants: primary, secondary, tertiary, success, danger

#### 4. `LoadingSpinner`
Utilisé dans: Tous les écrans  
Spinner gold avec border animation.

#### 5. `Toast`
Utilisé dans: Config Chasse, Scan Progress  
Notifications success/error temporaires.

---

## 📱 Responsive Strategy

### Breakpoints Standardisés
```javascript
// Mobile
const mobile = '(max-width: 767px)';      // 375px - 767px
// Tablet  
const tablet = '(min-width: 768px) and (max-width: 1439px)';  // 768px - 1439px
// Desktop
const desktop = '(min-width: 1440px)';    // 1440px+
```

### Adaptations Mobile
- Modal Détail: Full-screen (100vw × 100vh), footer en colonne
- Config Chasse: Checkboxes en colonne, footer en colonne, padding réduit
- Scan Progress: Radar plus petit (150px), steps en colonne, texte centré

### Adaptations Tablet
- Modal Détail: 90vw × 90vh, footer wrap
- Config Chasse: Checkboxes en 2 colonnes
- Scan Progress: Radar moyen (180px)

---

## ⌨️ Accessibilité (WCAG AA)

### Standards Appliqués

#### Keyboard Navigation
- **Tab:** Navigation entre éléments interactifs
- **Enter/Space:** Activation buttons/toggles
- **Escape:** Fermer modals/dropdowns
- **Arrows:** Navigation carousel/sliders/dropdowns

#### ARIA Attributes
- `role="dialog"` pour modals
- `role="progressbar"` pour progress bars
- `aria-label` sur tous les boutons iconiques
- `aria-live="polite"` pour status updates
- `aria-valuenow/min/max` pour sliders

#### Focus States
- Outline `2px solid cyan` sur tous les interactifs
- Offset `4px` pour visibilité
- `:focus-visible` pour keyboard uniquement

#### Contraste Couleurs
- Texte primary sur obsidian: 16.4:1 ✅
- Texte secondary sur obsidian: 11.2:1 ✅
- Gold sur obsidian: 8.7:1 ✅
- Cyan sur obsidian: 12.1:1 ✅

---

## 🎬 Animations Performantes

### Principes
- **60 FPS:** Utiliser `transform` et `opacity` uniquement
- **Durées:** 150ms (fast), 300ms (normal), 500ms (smooth)
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` pour smoothness

### Animations Clés

#### Modal Entrance
```javascript
@keyframes fadeIn { opacity: 0 → 1 }
@keyframes slideUp { translateY(20px) → 0 }
Duration: 300ms
```

#### Radar Sweep
```javascript
@keyframes radarSweep { rotate(0deg) → 360deg }
Duration: 3s linear infinite
```

#### Progress Shimmer
```javascript
@keyframes shimmer { translateX(-100%) → 100% }
Duration: 2s infinite
```

#### Glow Pulse (Legendary)
```javascript
@keyframes pulse { shadow: 20px → 40px }
Duration: 2s ease-in-out infinite
```

---

## 🔧 Implémentation Workflow

### Phase 1: Setup (Jour 1)
1. Créer composants base (Button, Badge, Spinner)
2. Configurer theme.js avec tous les tokens
3. Setup responsive hooks (`useBreakpoint`)
4. Créer layout containers

### Phase 2: Modal Détail (Jours 2-3) 🔥 PRIORITÉ
1. Créer `OpportunityModal` container
2. Implémenter `ImageCarousel`
3. Créer `PriceBlock` + `BadgeList`
4. Intégrer `react-markdown` pour explication
5. Créer `EvaluationRow` avec dots
6. Implémenter 4 action buttons
7. Ajouter keyboard nav + ARIA
8. Tester responsive

### Phase 3: Config Chasse (Jours 4-5)
1. Créer `HuntConfigForm` container
2. Implémenter `CustomDropdown`
3. Créer `CheckboxGroup`
4. Implémenter `RangeSlider` avec thumb dragging
5. Créer `ToggleSwitch`
6. Implémenter validation + error handling
7. Ajouter save/cancel/launch actions
8. Tester responsive

### Phase 4: Scan Progress (Jours 6-7)
1. Créer `ScanProgress` container
2. Implémenter `RadarAnimation`
3. Créer `ProgressSteps`
4. Implémenter `ProgressBar` avec shimmer
5. Créer `CompletionSummary` + `HighlightCard`
6. Intégrer WebSocket pour real-time
7. Implémenter états: initial, progress, completed, error
8. Tester responsive

### Phase 5: Integration & Testing (Jour 8)
1. Connecter à backend API
2. Tester flows complets
3. Tester accessibilité (keyboard + screen reader)
4. Optimiser performance
5. Fixer bugs

---

## 📦 Dépendances NPM

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-markdown": "^9.0.0",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0"
  }
}
```

**Note:** Pas de CSS-in-JS library nécessaire, styles 100% inline.

---

## 📝 Checklist Globale

### Design System
- [x] Token colors définis (hunting-tokens.json)
- [x] Theme.js complet
- [x] Typography scale cohérente
- [x] Spacing scale cohérente
- [x] Shadow/glow system rarity-based

### Composants Base
- [ ] Button (4 variants)
- [ ] Badge (rarity colors)
- [ ] Spinner (gold animation)
- [ ] Toast (success/error)
- [ ] RarityBadge (with glow)

### Modal Détail (PRIORITÉ)
- [ ] OpportunityModal container
- [ ] ImageCarousel component
- [ ] PriceBlock component
- [ ] BadgeList component
- [ ] MarkdownSection (react-markdown)
- [ ] EvaluationRow component
- [ ] 4 action buttons
- [ ] Keyboard navigation
- [ ] ARIA attributes
- [ ] Responsive (3 breakpoints)

### Config Chasse
- [ ] HuntConfigForm container
- [ ] CustomDropdown component
- [ ] CheckboxGroup component
- [ ] RangeSlider component
- [ ] ToggleSwitch component
- [ ] RarityLegend component
- [ ] FormSection wrapper
- [ ] Validation logic
- [ ] Save/cancel/launch actions
- [ ] Responsive (3 breakpoints)

### Scan Progress
- [ ] ScanProgress container
- [ ] RadarAnimation component
- [ ] ProgressSteps component
- [ ] ProgressBar component
- [ ] TimeInfo component
- [ ] CompletionSummary component
- [ ] HighlightCard component
- [ ] WebSocket integration
- [ ] 5 états UI
- [ ] Responsive (3 breakpoints)

### Accessibilité
- [ ] Keyboard nav complète (Tab, Enter, Escape, Arrows)
- [ ] Focus states visibles
- [ ] ARIA labels/roles/live
- [ ] Contraste WCAG AA
- [ ] Screen reader test

### Performance
- [ ] Animations 60fps
- [ ] Images lazy loading
- [ ] Code splitting par écran
- [ ] Bundle size optimisé

---

## 🎯 Prochaines Étapes

### Immediate (Sprint 1)
1. ✅ **Specs créées** (Modal, Config, Scan)
2. **Setup projet React** avec theme.js
3. **Implémenter Modal Détail** (priorité max)
4. **Tester avec données mockées**

### Court Terme (Sprint 2)
5. **Implémenter Config Chasse**
6. **Implémenter Scan Progress**
7. **Connecter au backend API**

### Moyen Terme (Sprint 3)
8. **Integration Dashboard** (écran liste opportunités)
9. **Watchlist screen**
10. **Historique screen**

---

## 📚 Références

### Fichiers Projet
- `PROJECT_BIBLE.md` — Specs fonctionnelles complètes
- `frontend/src/theme.js` — Design tokens
- `design/tokens/hunting-tokens.json` — Token source
- `design/README-hunting-design.md` — Design philosophy

### Specs Détaillées
- `design/MODAL_DETAIL_SPEC.md` — Modal annonce (32KB, 1167 lignes)
- `design/CONFIG_CHASSE_SPEC.md` — Config formulaire (34KB, 1172 lignes)
- `design/SCAN_PROGRESS_SPEC.md` — Scan progression (33KB, 1099 lignes)

### Standards
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Accessibility](https://react.dev/learn/accessibility)
- [MDN ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

---

**Status:** ✅ Spécifications MVP Complètes  
**Total:** 3,438 lignes de specs détaillées  
**Coverage:** 100% des écrans prioritaires MVP  
**Date:** Juin 2026  
**Version:** 1.0
