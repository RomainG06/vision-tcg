# 🔍 MODAL DÉTAIL ANNONCE — Spécification UI/UX

## 📋 Vue d'ensemble

Modal full-screen/overlay pour afficher les détails complets d'une opportunité détectée. Priorité maximale pour le MVP. Interface orientée décision rapide avec toutes les informations nécessaires pour évaluer et agir sur une annonce.

---

## 🎨 Wireframe ASCII

```
┌─────────────────────────────────────────────────────────────────┐
│ [X]                    OPPORTUNITÉ DÉTECTÉE              Score: 87│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │                      │  │ Lot 150 cartes Pokémon         │   │
│  │   [Image Carousel]   │  │ Wizards FR                     │   │
│  │      ◄  1/4  ►       │  │                                │   │
│  │                      │  │ Prix: 80 €  │ Estimation:      │   │
│  │   [Thumbnails]       │  │             │ 130–220 €        │   │
│  └──────────────────────┘  │                                │   │
│                            │ Potentiel: +50 à +140 €        │   │
│                            │                                │   │
│                            │ [WIZARDS] [FR] [LOT]           │   │
│                            │ [SOUS-COTÉ] [PROCHE] [HOLO?]   │   │
│                            └────────────────────────────────┘   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 📍 DÉTAILS ANNONCE                                         │  │
│  │                                                            │  │
│  │ Plateforme:  Leboncoin                                     │  │
│  │ Publié:      Il y a 12 minutes                             │  │
│  │ Localisation: Nice (06000) • 0 km de vous                 │  │
│  │ État:        Occasion                                      │  │
│  │ Vendeur:     Particulier (inscription 2019)                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ✨ POURQUOI C'EST INTÉRESSANT                              │  │
│  │                                                            │  │
│  │ ✓ Lot Wizards détecté (Base Set, Jungle, Fossil)         │  │
│  │ ✓ Édition française probable (mots-clés dans titre)       │  │
│  │ ✓ Prix sous marché (-38% vs estimation basse)             │  │
│  │ ✓ Vendeur proche (livraison main propre possible)         │  │
│  │ ✓ Cartes Holo potentiellement présentes                   │  │
│  │ ✓ Titre peu optimisé (faible concurrence)                 │  │
│  │                                                            │  │
│  │ ⚠️ Points de vigilance:                                    │  │
│  │ • Photos floues (vérifier état réel)                      │  │
│  │ • Aucune mention d'édition 1ère (à confirmer)             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 📊 ÉVALUATION                                              │  │
│  │                                                            │  │
│  │ Risque:          ●●○ MOYEN                                │  │
│  │ Confiance:       ●●●●○ 78%                                │  │
│  │ Compétition:     ●○○ FAIBLE (2 vues)                      │  │
│  │ Action suggérée: ⚡ Contacter rapidement                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [🔗 Voir l'annonce]  [⭐ Watchlist]  [❌ Ignorer]  [✅ Contacté]│
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Dimensions:**
- Desktop: 900px largeur × 90vh hauteur (max 1200px)
- Tablet: 90vw × 90vh
- Mobile: 100vw × 100vh (full-screen)

---

## 🧩 Structure des sections

### 1. **Header (fixed top)**
```javascript
const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing.lg,
  background: theme.colors.primary.midnight,
  borderBottom: `${theme.borders.widthThin} solid ${theme.accents.hunterGold}`,
  position: 'sticky',
  top: 0,
  zIndex: 100,
};
```

**Contenu:**
- Bouton fermeture (X) à gauche
- Titre "OPPORTUNITÉ DÉTECTÉE" (centré)
- Score badge (doré, rarity-based glow) à droite

### 2. **Body (scrollable)**

#### 2.1 Section Image + Prix
```javascript
const mediaGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing.xl,
  padding: theme.spacing.xl,
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
  },
};
```

**Carousel d'images:**
- Image principale (400×400px desktop, 100% mobile)
- Contrôles précédent/suivant
- Thumbnails en dessous (4 max visible)
- Indicateur "X/Y" centré

**Bloc Prix/Estimation:**
- Titre annonce (h2, gold accent)
- Prix affiché (large, gold)
- Estimation marché (cyan, range)
- Potentiel gain (green si positif)
- Badges horizontaux (wrap)

#### 2.2 Section Détails Annonce
```javascript
const detailsSectionStyle = {
  background: theme.colors.primary.deepDark,
  border: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
  borderRadius: theme.borders.radiusLg,
  padding: theme.spacing.lg,
  margin: `${theme.spacing.lg} ${theme.spacing.xl}`,
};
```

**Contenu:**
- Icône 📍 + titre section
- Grid 2 colonnes (label: value)
- Labels en tertiary, valeurs en secondary
- Highlight distance si < 20km (green)

#### 2.3 Section "Pourquoi c'est intéressant"
```javascript
const explanationSectionStyle = {
  background: theme.colors.primary.deepDark,
  border: `${theme.borders.widthThin} solid ${theme.accents.hunterGold}`,
  borderRadius: theme.borders.radiusLg,
  padding: theme.spacing.lg,
  margin: `${theme.spacing.lg} ${theme.spacing.xl}`,
  boxShadow: theme.shadows.glowLegendary, // Si score > 75
};
```

**Contenu:**
- Icône ✨ + titre section
- Liste markdown des points forts (✓ vert)
- Liste markdown des vigilances (⚠️ orange)
- Utiliser `react-markdown` avec styles inline

#### 2.4 Section Évaluation
```javascript
const evaluationSectionStyle = {
  background: theme.colors.primary.deepDark,
  border: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
  borderRadius: theme.borders.radiusLg,
  padding: theme.spacing.lg,
  margin: `${theme.spacing.lg} ${theme.spacing.xl}`,
};
```

**Contenu:**
- Risque (●●● dots, color-coded)
- Confiance (percentage + dots)
- Compétition (dots + texte)
- Action suggérée (emoji + texte, color-coded)

### 3. **Footer (fixed bottom)**
```javascript
const footerStyle = {
  display: 'flex',
  gap: theme.spacing.md,
  padding: theme.spacing.lg,
  background: theme.colors.primary.midnight,
  borderTop: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
  position: 'sticky',
  bottom: 0,
  justifyContent: 'center',
  '@media (max-width: 768px)': {
    flexDirection: 'column',
  },
};
```

**Boutons:**
- Voir l'annonce (primary, gold)
- Ajouter à watchlist (secondary, cyan)
- Ignorer (tertiary, muted)
- Marquer contacté (secondary, green)

---

## 🎨 Styles inline React

### Composant Modal Container
```javascript
const modalContainerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(10, 14, 39, 0.95)', // Obsidian avec alpha
  backdropFilter: 'blur(8px)',
  padding: theme.spacing.lg,
};

const modalContentStyle = {
  background: theme.colors.primary.obsidian,
  border: `${theme.borders.widthMedium} solid ${theme.accents.hunterGold}`,
  borderRadius: theme.borders.radiusLg,
  boxShadow: theme.shadows.xl,
  maxWidth: '900px',
  width: '100%',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const modalBodyStyle = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
};
```

### Score Badge
```javascript
const getScoreBadgeStyle = (score) => {
  const rarity = getRarityLevel(score);
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    background: theme.colors.status[rarity],
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.bodyLg,
    fontWeight: theme.typography.weights.bold,
    fontFamily: theme.typography.fonts.mono,
    borderRadius: theme.borders.radiusMd,
    boxShadow: theme.shadows[`glow${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`],
  };
};
```

### Image Carousel
```javascript
const carouselContainerStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '1/1',
  background: theme.colors.primary.deepDark,
  borderRadius: theme.borders.radiusLg,
  overflow: 'hidden',
  border: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
};

const carouselImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  background: theme.colors.primary.midnight,
};

const carouselButtonStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(18, 22, 51, 0.8)',
  color: theme.accents.hunterGold,
  border: `${theme.borders.widthThin} solid ${theme.accents.hunterGold}`,
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: theme.effects.transitionFast,
  zIndex: 10,
};

const carouselButtonLeftStyle = {
  ...carouselButtonStyle,
  left: theme.spacing.md,
};

const carouselButtonRightStyle = {
  ...carouselButtonStyle,
  right: theme.spacing.md,
};

const thumbnailsContainerStyle = {
  display: 'flex',
  gap: theme.spacing.sm,
  marginTop: theme.spacing.md,
  justifyContent: 'center',
  flexWrap: 'nowrap',
  overflowX: 'auto',
};

const thumbnailStyle = (isActive) => ({
  width: '60px',
  height: '60px',
  objectFit: 'cover',
  borderRadius: theme.borders.radiusSm,
  cursor: 'pointer',
  opacity: isActive ? 1 : 0.5,
  border: isActive 
    ? `${theme.borders.widthMedium} solid ${theme.accents.hunterGold}`
    : `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
  transition: theme.effects.transitionFast,
});
```

### Prix et Estimation
```javascript
const priceBlockStyle = {
  background: theme.colors.primary.deepDark,
  border: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
  borderRadius: theme.borders.radiusLg,
  padding: theme.spacing.lg,
};

const titleStyle = {
  fontSize: theme.typography.sizes.headingMd,
  fontWeight: theme.typography.weights.bold,
  fontFamily: theme.typography.fonts.heading,
  color: theme.colors.text.primary,
  marginBottom: theme.spacing.md,
  lineHeight: 1.3,
};

const priceRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: theme.spacing.md,
  paddingBottom: theme.spacing.md,
  borderBottom: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
};

const priceLabelStyle = {
  fontSize: theme.typography.sizes.bodyMd,
  color: theme.colors.text.tertiary,
  fontWeight: theme.typography.weights.medium,
};

const priceValueStyle = {
  fontSize: theme.typography.sizes.headingLg,
  fontWeight: theme.typography.weights.bold,
  fontFamily: theme.typography.fonts.mono,
  color: theme.accents.hunterGold,
};

const estimationValueStyle = {
  fontSize: theme.typography.sizes.bodyLg,
  fontWeight: theme.typography.weights.semibold,
  fontFamily: theme.typography.fonts.mono,
  color: theme.accents.manaCyan,
};

const potentialValueStyle = {
  fontSize: theme.typography.sizes.bodyLg,
  fontWeight: theme.typography.weights.semibold,
  fontFamily: theme.typography.fonts.mono,
  color: theme.accents.successGreen,
};
```

### Badges
```javascript
const badgesContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing.sm,
  marginTop: theme.spacing.md,
};

const getBadgeStyle = (badgeType) => {
  const badgeConfig = badgeLabels[badgeType] || { color: theme.colors.text.muted };
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    background: `${badgeConfig.color}20`, // 20% opacity
    color: badgeConfig.color,
    fontSize: theme.typography.sizes.tiny,
    fontWeight: theme.typography.weights.bold,
    fontFamily: theme.typography.fonts.mono,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    borderRadius: theme.borders.radiusSm,
    border: `${theme.borders.widthThin} solid ${badgeConfig.color}40`,
  };
};
```

### Section Markdown (Explication)
```javascript
const markdownSectionStyle = {
  background: theme.colors.primary.deepDark,
  border: `${theme.borders.widthThin} solid ${theme.accents.hunterGold}`,
  borderRadius: theme.borders.radiusLg,
  padding: theme.spacing.lg,
  margin: `${theme.spacing.lg} ${theme.spacing.xl}`,
};

const markdownTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  fontSize: theme.typography.sizes.headingSm,
  fontWeight: theme.typography.weights.bold,
  color: theme.colors.text.primary,
  marginBottom: theme.spacing.md,
};

const markdownContentStyle = {
  fontSize: theme.typography.sizes.bodyMd,
  lineHeight: 1.6,
  color: theme.colors.text.secondary,
};

// Styles pour react-markdown
const markdownComponents = {
  ul: ({ children }) => (
    <ul style={{ 
      listStyle: 'none', 
      padding: 0, 
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.sm,
    }}>
      {children}
    </ul>
  ),
  li: ({ children }) => {
    const isWarning = children[0]?.props?.children?.includes('⚠️');
    return (
      <li style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
        padding: theme.spacing.sm,
        background: isWarning 
          ? `${theme.accents.warningOrange}10` 
          : `${theme.accents.successGreen}10`,
        borderRadius: theme.borders.radiusSm,
        borderLeft: `${theme.borders.widthThick} solid ${
          isWarning ? theme.accents.warningOrange : theme.accents.successGreen
        }`,
      }}>
        {children}
      </li>
    );
  },
  strong: ({ children }) => (
    <strong style={{
      color: theme.accents.hunterGold,
      fontWeight: theme.typography.weights.bold,
    }}>
      {children}
    </strong>
  ),
};
```

### Évaluation (Risk dots)
```javascript
const evaluationRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${theme.spacing.sm} 0`,
};

const evaluationLabelStyle = {
  fontSize: theme.typography.sizes.bodyMd,
  color: theme.colors.text.tertiary,
  fontWeight: theme.typography.weights.medium,
};

const evaluationValueStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  fontSize: theme.typography.sizes.bodyMd,
  fontWeight: theme.typography.weights.semibold,
};

const getDotStyle = (filled, level) => {
  const colors = {
    low: theme.accents.successGreen,
    medium: theme.accents.warningOrange,
    high: theme.accents.preyRed,
  };
  return {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: filled ? colors[level] : 'transparent',
    border: `${theme.borders.widthThin} solid ${colors[level]}`,
  };
};

const riskDotsContainerStyle = {
  display: 'flex',
  gap: theme.spacing.xs,
};
```

### Boutons Footer
```javascript
const primaryButtonStyle = {
  flex: 1,
  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
  background: theme.accents.hunterGold,
  color: theme.colors.primary.obsidian,
  fontSize: theme.typography.sizes.bodyLg,
  fontWeight: theme.typography.weights.bold,
  fontFamily: theme.typography.fonts.heading,
  border: 'none',
  borderRadius: theme.borders.radiusMd,
  cursor: 'pointer',
  transition: theme.effects.transitionFast,
  boxShadow: theme.shadows.md,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.sm,
};

const secondaryButtonStyle = {
  flex: 1,
  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
  background: 'transparent',
  color: theme.accents.manaCyan,
  fontSize: theme.typography.sizes.bodyMd,
  fontWeight: theme.typography.weights.semibold,
  border: `${theme.borders.widthThin} solid ${theme.accents.manaCyan}`,
  borderRadius: theme.borders.radiusMd,
  cursor: 'pointer',
  transition: theme.effects.transitionFast,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.sm,
};

const tertiaryButtonStyle = {
  flex: 1,
  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
  background: 'transparent',
  color: theme.colors.text.muted,
  fontSize: theme.typography.sizes.bodyMd,
  fontWeight: theme.typography.weights.medium,
  border: `${theme.borders.widthThin} solid ${theme.colors.text.muted}`,
  borderRadius: theme.borders.radiusMd,
  cursor: 'pointer',
  transition: theme.effects.transitionFast,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.sm,
};

const successButtonStyle = {
  ...secondaryButtonStyle,
  color: theme.accents.successGreen,
  borderColor: theme.accents.successGreen,
};
```

---

## 🔄 États UI

### 1. Loading
```javascript
const loadingOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(10, 14, 39, 0.95)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.lg,
  zIndex: 200,
};

const spinnerStyle = {
  width: '48px',
  height: '48px',
  border: `${theme.borders.widthThick} solid ${theme.colors.primary.slate}`,
  borderTop: `${theme.borders.widthThick} solid ${theme.accents.hunterGold}`,
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

// Animation à ajouter dans un <style> tag
// @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
```

**Message:** "Chargement des détails..."

### 2. Error
```javascript
const errorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.lg,
  padding: theme.spacing.xxxl,
  textAlign: 'center',
};

const errorIconStyle = {
  fontSize: '64px',
  color: theme.accents.preyRed,
};

const errorTitleStyle = {
  fontSize: theme.typography.sizes.headingMd,
  fontWeight: theme.typography.weights.bold,
  color: theme.colors.text.primary,
};

const errorMessageStyle = {
  fontSize: theme.typography.sizes.bodyMd,
  color: theme.colors.text.secondary,
  maxWidth: '400px',
};
```

**Message:** "⚠️ Impossible de charger l'annonce. Elle a peut-être été supprimée."

### 3. Success (data loaded)
État normal avec toutes les sections visibles.

### 4. Empty State (no images)
```javascript
const noImagePlaceholderStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.colors.primary.midnight,
  color: theme.colors.text.muted,
  fontSize: theme.typography.sizes.bodyLg,
  fontFamily: theme.typography.fonts.mono,
};
```

**Message:** "📷 Aucune image disponible"

---

## 📱 Responsive Breakpoints

### Desktop (1440px+)
```javascript
const desktopModalStyle = {
  maxWidth: '900px',
  maxHeight: '90vh',
};

const desktopMediaGridStyle = {
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing.xl,
};
```

### Tablet (768px)
```javascript
const tabletModalStyle = {
  width: '90vw',
  maxHeight: '90vh',
};

const tabletMediaGridStyle = {
  gridTemplateColumns: '1fr',
  gap: theme.spacing.lg,
};

const tabletFooterStyle = {
  flexWrap: 'wrap',
};
```

### Mobile (375px)
```javascript
const mobileModalStyle = {
  width: '100vw',
  height: '100vh',
  maxHeight: '100vh',
  borderRadius: 0,
  border: 'none',
};

const mobileHeaderStyle = {
  padding: theme.spacing.md,
};

const mobileMediaGridStyle = {
  gridTemplateColumns: '1fr',
  padding: theme.spacing.md,
};

const mobileFooterStyle = {
  flexDirection: 'column',
  padding: theme.spacing.md,
  gap: theme.spacing.sm,
};

const mobileButtonStyle = {
  width: '100%',
};
```

**Media queries à implémenter:**
```javascript
const useResponsiveStyles = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1440);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet };
};
```

---

## ⌨️ Interactions & Accessibilité

### Keyboard Navigation
```javascript
const handleKeyDown = (e) => {
  switch(e.key) {
    case 'Escape':
      onClose();
      break;
    case 'ArrowLeft':
      previousImage();
      break;
    case 'ArrowRight':
      nextImage();
      break;
    case 'Enter':
      if (document.activeElement.tagName === 'BUTTON') {
        document.activeElement.click();
      }
      break;
  }
};
```

### Focus States
```javascript
const buttonFocusStyle = {
  outline: `${theme.borders.widthMedium} solid ${theme.accents.hunterGold}`,
  outlineOffset: theme.spacing.xs,
};

const interactiveFocusStyle = {
  ':focus-visible': {
    outline: `${theme.borders.widthMedium} solid ${theme.accents.manaCyan}`,
    outlineOffset: theme.spacing.xs,
  },
};
```

### Hover States
```javascript
const primaryButtonHoverStyle = {
  ':hover': {
    background: theme.accents.manaCyan,
    boxShadow: `0 0 20px ${theme.accents.manaCyan}40`,
    transform: 'translateY(-2px)',
  },
};

const secondaryButtonHoverStyle = {
  ':hover': {
    background: `${theme.accents.manaCyan}20`,
    borderColor: theme.accents.hunterGold,
  },
};

const tertiaryButtonHoverStyle = {
  ':hover': {
    background: `${theme.colors.text.muted}10`,
    color: theme.colors.text.secondary,
  },
};

const carouselButtonHoverStyle = {
  ':hover': {
    background: 'rgba(18, 22, 51, 1)',
    boxShadow: `0 0 10px ${theme.accents.hunterGold}60`,
  },
};

const thumbnailHoverStyle = {
  ':hover': {
    opacity: 1,
    borderColor: theme.accents.manaCyan,
  },
};
```

### Click Handlers
```javascript
// Fermer modal sur backdrop click
const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
};

// Carousel navigation
const nextImage = () => {
  setCurrentImageIndex((prev) => (prev + 1) % images.length);
};

const previousImage = () => {
  setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
};

// Actions
const handleViewListing = () => {
  window.open(listing.url, '_blank');
  trackAction('view_listing', listing.id);
};

const handleAddToWatchlist = () => {
  addToWatchlist(listing.id);
  showToast('Ajouté à la watchlist', 'success');
};

const handleIgnore = () => {
  ignoreListing(listing.id);
  onClose();
  showToast('Annonce ignorée', 'info');
};

const handleMarkContacted = () => {
  markAsContacted(listing.id);
  onClose();
  showToast('Marqué comme contacté', 'success');
};
```

### ARIA Attributes
```javascript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  onKeyDown={handleKeyDown}
>
  <button
    aria-label="Fermer la modal"
    onClick={onClose}
  >
    ×
  </button>

  <h2 id="modal-title">OPPORTUNITÉ DÉTECTÉE</h2>

  <div
    role="region"
    aria-label="Carrousel d'images"
    aria-live="polite"
  >
    <button aria-label="Image précédente">◀</button>
    <img alt={listing.title} />
    <button aria-label="Image suivante">▶</button>
  </div>

  <div id="modal-description">
    {/* Contenu markdown */}
  </div>

  <button
    aria-label="Voir l'annonce sur la plateforme"
    aria-pressed={false}
  >
    🔗 Voir l'annonce
  </button>
</div>
```

---

## 🧩 Composants React à créer

### 1. `OpportunityModal`
**Props:**
```typescript
interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
}
```

**Responsabilités:**
- Fetch listing data on mount
- Handle loading/error states
- Render modal overlay & content
- Trap focus inside modal
- Handle backdrop & escape key close

### 2. `ImageCarousel`
**Props:**
```typescript
interface ImageCarouselProps {
  images: string[];
  alt: string;
}
```

**Responsabilités:**
- Display image carousel
- Handle prev/next navigation
- Show thumbnails
- Keyboard navigation (arrows)

### 3. `PriceBlock`
**Props:**
```typescript
interface PriceBlockProps {
  price: number;
  estimationLow: number;
  estimationHigh: number;
  potential: { min: number; max: number };
  currency?: string;
}
```

**Responsabilités:**
- Format prices with currency
- Calculate and display potential gain
- Apply color-coding based on value

### 4. `BadgeList`
**Props:**
```typescript
interface BadgeListProps {
  badges: string[];
}
```

**Responsabilités:**
- Render badges with colors from badgeLabels
- Handle badge wrapping
- Show emoji + text

### 5. `MarkdownSection`
**Props:**
```typescript
interface MarkdownSectionProps {
  title: string;
  icon: string;
  content: string;
  variant?: 'default' | 'highlighted';
}
```

**Responsabilités:**
- Render markdown with react-markdown
- Apply custom component styles
- Handle lists, strong, links

### 6. `EvaluationRow`
**Props:**
```typescript
interface EvaluationRowProps {
  label: string;
  level: 'low' | 'medium' | 'high';
  value: string | number;
  showDots?: boolean;
  maxDots?: number;
}
```

**Responsabilités:**
- Render evaluation metrics
- Show risk dots (filled/empty)
- Color-code by level

### 7. `ActionButton`
**Props:**
```typescript
interface ActionButtonProps {
  variant: 'primary' | 'secondary' | 'tertiary' | 'success';
  icon?: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}
```

**Responsabilités:**
- Render button with variant styles
- Handle hover/focus states
- Show loading spinner if needed
- Disable interaction when needed

---

## 🎬 Animations

### Modal Entrance
```javascript
const modalEntranceAnimation = {
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  '@keyframes slideUp': {
    from: { transform: 'translateY(20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  animation: 'fadeIn 200ms ease-out, slideUp 300ms ease-out',
};
```

### Score Badge Glow (si score > 75)
```javascript
const scoreBadgeGlowAnimation = {
  '@keyframes pulse': {
    '0%, 100%': { boxShadow: theme.shadows.glowLegendary },
    '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)' },
  },
  animation: 'pulse 2s ease-in-out infinite',
};
```

### Button Hover Lift
```javascript
const buttonLiftAnimation = {
  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  ':hover': {
    transform: 'translateY(-2px)',
  },
  ':active': {
    transform: 'translateY(0)',
  },
};
```

---

## 📦 Data Structure Example

```javascript
const listingData = {
  id: 'lbc-123456',
  title: 'Lot 150 cartes Pokémon Wizards FR',
  price: 80,
  estimationLow: 130,
  estimationHigh: 220,
  potential: { min: 50, max: 140 },
  score: 87,
  rarity: 'legendary',
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
    'https://example.com/image4.jpg',
  ],
  platform: 'Leboncoin',
  publishedAt: '2026-06-16T10:23:00Z',
  location: 'Nice (06000)',
  distance: 0,
  condition: 'Occasion',
  seller: {
    type: 'Particulier',
    registeredSince: '2019',
  },
  badges: ['wizards_detected', 'french_edition', 'lot_detected', 'holographic', 'below_market', 'near_location'],
  explanation: `✓ Lot Wizards détecté (Base Set, Jungle, Fossil)
✓ Édition française probable (mots-clés dans titre)
✓ Prix sous marché (-38% vs estimation basse)
✓ Vendeur proche (livraison main propre possible)
✓ Cartes Holo potentiellement présentes
✓ Titre peu optimisé (faible concurrence)

⚠️ **Points de vigilance:**
• Photos floues (vérifier état réel)
• Aucune mention d'édition 1ère (à confirmer)`,
  risk: 'medium',
  confidence: 78,
  competition: 'low',
  views: 2,
  suggestedAction: 'Contacter rapidement',
  url: 'https://leboncoin.fr/annonce/123456',
};
```

---

## ✅ Checklist d'implémentation

- [ ] Créer composant `OpportunityModal` avec overlay
- [ ] Implémenter `ImageCarousel` avec navigation
- [ ] Créer composant `PriceBlock` avec formatage
- [ ] Implémenter `BadgeList` avec mapping
- [ ] Intégrer `react-markdown` pour explication
- [ ] Créer composant `EvaluationRow` avec dots
- [ ] Implémenter 4 boutons d'action
- [ ] Ajouter keyboard navigation (Escape, arrows, Enter)
- [ ] Implémenter focus trap dans modal
- [ ] Ajouter ARIA attributes pour accessibilité
- [ ] Créer responsive breakpoints (mobile, tablet, desktop)
- [ ] Implémenter états loading/error/success
- [ ] Ajouter animations (entrance, glow, hover)
- [ ] Tester navigation clavier
- [ ] Tester lecteur d'écran
- [ ] Vérifier contraste couleurs (WCAG AA)

---

**Status:** ✅ Spécification complète  
**Priority:** 🔥 Maximum  
**Date:** Juin 2026  
**Version:** 1.0
