# Phase 3: Code Transformation Examples

**Practical code examples showing how to transform from Fantasy → Hunting theme**

---

## 1️⃣ Theme.js Transformation

### BEFORE (Heroic Fantasy Magic):
```javascript
export const theme = {
  colors: {
    primary: {
      deepBlue: '#0B3D91',
      arcanePurple: '#5B21B6',
      arcanePurpleLight: '#7C3AED',
    },
    accent: {
      enchantGold: '#FFD700',
      manaBlue: '#00D9FF',
    },
    neutral: {
      bgDark: '#0F1419',
      bgCard: '#1A2332',
      textPrimary: '#F8F9FA',
    },
  },
};
```

### AFTER (Hunting Dashboard):
```javascript
export const huntingTheme = {
  colors: {
    primary: {
      obsidian: '#0A0E27',      // Main background
      midnight: '#121633',      // Header surfaces
      deepDark: '#1A1F3A',      // Card backgrounds
      slate: '#1E2847',         // Subtle accents
    },
    status: {
      common: '#4B5563',        // Score 0-39
      rare: '#7C3AED',          // Score 40-59
      epic: '#0EA5E9',          // Score 60-74
      legendary: '#FFD700',     // Score 75-89
      mythique: '#FF1744',      // Score 90-100
    },
    accents: {
      hunterGold: '#E6B85C',    // Primary accent (radar, highlights)
      manaCyan: '#00D9FF',      // Energy, highlights
      preyRed: '#FF1744',       // Alerts, danger
      successGreen: '#10B981',  // Confirmed matches
      warningOrange: '#F59E0B', // Caution
    },
    text: {
      primary: '#F8FAFC',       // Headlines, primary text
      secondary: '#CBD5E1',     // Body text
      tertiary: '#94A3B8',      // Labels, subtle text
      muted: '#64748B',         // Disabled, timestamps
    },
  },
  typography: {
    fonts: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      heading: 'Outfit, Inter, sans-serif',
      mono: 'JetBrains Mono, Courier New, monospace',
    },
    // ... rest
  },
};
```

---

## 2️⃣ App.jsx Header Transformation

### BEFORE:
```javascript
<header style={styles.header}>
  <h1 style={styles.title}>
    <span style={styles.titleIcon}>🃏</span> Vision TCG
  </h1>
  <p style={styles.subtitle}>
    Détection et priorisation de lots de cartes{' '}
    <span style={styles.subtitleHighlight}>Pokémon Wizards</span>
  </p>
</header>
```

### AFTER:
```javascript
<header style={styles.header}>
  <h1 style={styles.title}>
    <span style={styles.titleIcon}>🎯</span> Vision Hunting
  </h1>
  <p style={styles.subtitle}>
    Détecteur d'opportunités pour collectionneurs{' '}
    <span style={styles.subtitleHighlight}>Pokémon Wizards</span>
  </p>
  
  {/* Hunt Status Bar */}
  <div style={styles.huntStatus}>
    <span style={styles.huntLabel}>Chasse active:</span>
    <span style={styles.huntName}>Wizards FR</span>
    <span style={styles.opportunityCount}>
      5 opportunités fortes détectées
    </span>
  </div>
</header>

// Styles:
const styles = {
  header: {
    background: theme.colors.primary.midnight,
    borderBottom: `2px solid ${theme.colors.accents.hunterGold}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
    padding: theme.spacing.xl,
  },
  huntStatus: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    background: theme.colors.primary.deepDark,
    borderRadius: theme.borders.radiusMd,
    display: 'flex',
    gap: theme.spacing.md,
    alignItems: 'center',
    fontSize: theme.typography.sizes.bodySm,
  },
  huntLabel: {
    color: theme.colors.text.tertiary,
    fontWeight: 500,
  },
  huntName: {
    color: theme.colors.accents.hunterGold,
    fontWeight: 700,
    fontFamily: theme.typography.fonts.mono,
    textTransform: 'uppercase',
  },
  opportunityCount: {
    color: theme.colors.status.legendary,
    fontWeight: 600,
    marginLeft: 'auto',
  },
};
```

---

## 3️⃣ LotList.jsx Card Transformation

### BEFORE (Basic card):
```javascript
<div
  style={{
    ...styles.card,
    ...(listing.status === 'new' && styles.cardNew),
  }}
  onClick={() => setSelectedLot(listing)}
>
  <div style={styles.header}>
    <span style={styles.score}>{listing.score}</span>
    <span style={styles.source}>{listing.source}</span>
  </div>
  
  <h3 style={styles.title}>{listing.title}</h3>
  
  <div style={styles.badges}>
    {listing.is_wizards === 1 && <span style={styles.badgeWizards}>⭐ Wizards</span>}
    {listing.is_french === 1 && <span style={styles.badgeFrench}>🇫🇷 Français</span>}
  </div>
</div>
```

### AFTER (Hunting card with rarity):
```javascript
import { getScoreTier, getRarityStyles } from '../utils/rarity.js';
import { Badge } from './Badge.jsx';

// In component:
const tier = getScoreTier(listing.score);
const rarityStyles = getRarityStyles(tier, theme);

<div
  role="button"
  tabIndex={0}
  className="opportunity-card"
  style={{
    ...styles.card,
    ...rarityStyles,
  }}
  onClick={() => setSelectedLot(listing)}
  onKeyPress={(e) => {
    if (e.key === 'Enter') setSelectedLot(listing);
  }}
  aria-label={`${listing.title}, score ${listing.score}, ${tier} tier`}
>
  {/* Score Badge with Tier */}
  <div style={styles.header}>
    <div style={{
      ...styles.scoreBadge,
      background: getScoreGradient(tier),
      boxShadow: getScoreShadow(tier),
    }}>
      <span style={styles.scoreValue}>{listing.score}</span>
      <span style={styles.scoreTier}>{getTierLabel(tier)}</span>
    </div>
    <span style={styles.source}>{listing.source}</span>
  </div>
  
  {/* Image or Placeholder */}
  {listing.image_url ? (
    <img src={listing.image_url} alt={listing.title} style={styles.image} />
  ) : (
    <div style={styles.imagePlaceholder}>
      <span style={styles.imagePlaceholderIcon}>🎴</span>
    </div>
  )}
  
  {/* Content */}
  <div style={styles.content}>
    <h3 style={styles.title}>{listing.title}</h3>
    
    <div style={styles.meta}>
      <span style={styles.price}>{listing.price}€</span>
      <span style={styles.location}>
        📍 {listing.location} ({listing.distance_km}km)
      </span>
    </div>
    
    {/* Opportunity Signals as Badges */}
    <div style={styles.signalsSection} aria-label="Opportunity signals">
      {listing.opportunity_signals?.map(signal => (
        <Badge key={signal} type={mapSignalToBadge(signal)} theme={theme} />
      ))}
    </div>
    
    {/* Value Estimate */}
    {listing.value_estimate && (
      <div style={styles.valueEstimate}>
        <span style={styles.valueLabel}>Valeur estimée:</span>
        <span style={styles.valueRange}>
          {listing.value_estimate.min}€ - {listing.value_estimate.max}€
        </span>
        <span style={styles.valueConfidence}>
          ({listing.value_estimate.confidence})
        </span>
      </div>
    )}
    
    {/* Risk Indicators */}
    {listing.risk_signals?.length > 0 && (
      <div style={styles.riskIndicator}>
        <span style={styles.riskIcon}>⚠️</span>
        <span style={styles.riskText}>
          Risque: {getRiskLevel(listing.risk_signals)}
        </span>
      </div>
    )}
  </div>
</div>

// Styles:
const styles = {
  card: {
    background: theme.colors.primary.deepDark,
    borderRadius: theme.borders.radiusLg,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    // Border and glow added by rarityStyles
  },
  scoreBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '12px',
    minWidth: '70px',
  },
  scoreValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: theme.colors.text.primary,
    lineHeight: 1,
  },
  scoreTier: {
    fontSize: '10px',
    fontWeight: 600,
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    marginTop: '4px',
    opacity: 0.9,
  },
  signalsSection: {
    display: 'flex',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    marginTop: theme.spacing.md,
  },
  valueEstimate: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    background: theme.colors.primary.midnight,
    borderRadius: theme.borders.radiusMd,
    display: 'flex',
    gap: theme.spacing.xs,
    alignItems: 'center',
    fontSize: theme.typography.sizes.bodySm,
  },
  valueLabel: {
    color: theme.colors.text.tertiary,
    fontWeight: 500,
  },
  valueRange: {
    color: theme.colors.accents.hunterGold,
    fontWeight: 700,
    fontFamily: theme.typography.fonts.mono,
  },
  valueConfidence: {
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    marginLeft: 'auto',
  },
  riskIndicator: {
    marginTop: theme.spacing.sm,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    background: 'rgba(255, 23, 68, 0.1)',
    border: `1px solid ${theme.colors.accents.preyRed}`,
    borderRadius: theme.borders.radiusMd,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  riskIcon: {
    fontSize: '14px',
  },
  riskText: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.accents.preyRed,
    fontWeight: 600,
  },
};
```

---

## 4️⃣ Utility Functions

### `utils/rarity.js`:
```javascript
/**
 * Get rarity tier from score
 */
export function getScoreTier(score) {
  if (score >= 90) return 'legendary';
  if (score >= 75) return 'epic';
  if (score >= 60) return 'rare';
  if (score >= 40) return 'interesting';
  return 'common';
}

/**
 * Get tier label (French)
 */
export function getTierLabel(tier) {
  const labels = {
    legendary: 'Légendaire',
    epic: 'Épique',
    rare: 'Rare',
    interesting: 'Intéressant',
    common: 'Normal',
  };
  return labels[tier] || 'Normal';
}

/**
 * Get rarity-based card styles
 */
export function getRarityStyles(tier, theme) {
  const styles = {
    legendary: {
      border: `3px solid ${theme.colors.status.legendary}`,
      boxShadow: `0 0 20px rgba(255, 215, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.6)`,
      animation: 'huntPulse 2s ease-in-out infinite',
    },
    epic: {
      border: `2px solid ${theme.colors.status.epic}`,
      boxShadow: `0 0 16px rgba(14, 165, 233, 0.4), 0 4px 12px rgba(0, 0, 0, 0.5)`,
    },
    rare: {
      border: `2px solid ${theme.colors.status.rare}`,
      boxShadow: `0 0 16px rgba(124, 58, 237, 0.3), 0 4px 12px rgba(0, 0, 0, 0.5)`,
    },
    interesting: {
      border: `1px solid ${theme.colors.status.rare}`,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
    },
    common: {
      border: `1px solid ${theme.colors.primary.slate}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    },
  };
  return styles[tier] || styles.common;
}

/**
 * Get score gradient background
 */
export function getScoreGradient(tier) {
  const gradients = {
    legendary: `linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)`,
    epic: `linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)`,
    rare: `linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)`,
    interesting: `linear-gradient(135deg, #7C3AED 0%, #6B21B6 100%)`,
    common: `linear-gradient(135deg, #4B5563 0%, #3F4556 100%)`,
  };
  return gradients[tier] || gradients.common;
}

/**
 * Get score shadow
 */
export function getScoreShadow(tier) {
  const shadows = {
    legendary: '0 0 16px rgba(255, 215, 0, 0.6)',
    epic: '0 0 12px rgba(14, 165, 233, 0.5)',
    rare: '0 0 12px rgba(124, 58, 237, 0.4)',
    interesting: '0 2px 8px rgba(0, 0, 0, 0.3)',
    common: '0 1px 4px rgba(0, 0, 0, 0.2)',
  };
  return shadows[tier] || shadows.common;
}

/**
 * Map backend signal to badge type
 */
export function mapSignalToBadge(signal) {
  const map = {
    wizards_detected: 'WIZARDS',
    french_edition: 'FR',
    lot_detected: 'LOT',
    near_location: 'PROCHE',
    rare_cards: 'HOLO',
    below_market: 'SOUS-COTÉ',
    holographic: 'HOLO',
    complete_set: 'COMPLET',
  };
  return map[signal] || signal.toUpperCase();
}

/**
 * Calculate risk level from signals
 */
export function getRiskLevel(riskSignals) {
  if (!riskSignals || riskSignals.length === 0) return 'BAS';
  if (riskSignals.length <= 2) return 'MOYEN';
  return 'ÉLEVÉ';
}
```

---

## 5️⃣ Badge Component

### `components/Badge.jsx`:
```javascript
import React from 'react';

export function Badge({ type, theme }) {
  const badgeConfigs = {
    WIZARDS: {
      bg: theme.colors.status.legendary,
      color: theme.colors.primary.obsidian,
      icon: '⭐',
      shadow: '0 0 12px rgba(255, 215, 0, 0.4)',
    },
    FR: {
      bg: theme.colors.status.rare,
      color: theme.colors.text.primary,
      icon: '🇫🇷',
      shadow: '0 0 12px rgba(124, 58, 237, 0.3)',
    },
    LOT: {
      bg: theme.colors.accents.manaCyan,
      color: theme.colors.primary.obsidian,
      icon: '📦',
      shadow: '0 0 12px rgba(0, 217, 255, 0.3)',
    },
    PROCHE: {
      bg: theme.colors.accents.successGreen,
      color: theme.colors.primary.obsidian,
      icon: '📍',
      shadow: '0 0 8px rgba(16, 185, 129, 0.3)',
    },
    'SOUS-COTÉ': {
      bg: theme.colors.accents.warningOrange,
      color: theme.colors.primary.obsidian,
      icon: '💰',
      shadow: '0 0 8px rgba(245, 158, 11, 0.3)',
    },
    HOLO: {
      bg: theme.colors.status.legendary,
      color: theme.colors.primary.obsidian,
      icon: '✨',
      shadow: '0 0 12px rgba(255, 215, 0, 0.4)',
    },
    default: {
      bg: theme.colors.primary.slate,
      color: theme.colors.text.secondary,
      icon: '',
      shadow: 'none',
    },
  };
  
  const config = badgeConfigs[type] || badgeConfigs.default;
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: config.bg,
      color: config.color,
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: theme.typography.fonts.mono,
      textTransform: 'uppercase',
      boxShadow: config.shadow,
      letterSpacing: '0.5px',
    }}>
      {config.icon && <span>{config.icon}</span>}
      <span>{type}</span>
    </span>
  );
}
```

---

## 6️⃣ CSS Animations

### Add to App.jsx (or separate CSS file):
```javascript
// In App.jsx or main component:
const huntingAnimations = document.createElement('style');
huntingAnimations.textContent = `
  @keyframes huntPulse {
    0%, 100% {
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.6);
    }
    50% {
      box-shadow: 0 0 40px rgba(255, 215, 0, 0.6), 0 12px 32px rgba(0, 0, 0, 0.8);
    }
  }
  
  @keyframes radarSweep {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes scoreGlow {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
  
  .opportunity-card:hover {
    transform: translateY(-8px) scale(1.02);
    transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .opportunity-card:focus {
    outline: 3px solid #E6B85C;
    outline-offset: 2px;
  }
  
  /* Responsive Grid */
  .opportunity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 32px;
  }
  
  @media (max-width: 768px) {
    .opportunity-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
  
  @media (min-width: 1440px) {
    .opportunity-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
`;
document.head.appendChild(huntingAnimations);
```

---

## 7️⃣ Responsive Grid Update

### LotList.jsx:
```javascript
// Replace:
<div style={styles.grid}>
  {listings.map(...)}
</div>

// With:
<div className="opportunity-grid">
  {listings.map((listing) => (
    <OpportunityCard
      key={listing.id}
      listing={listing}
      theme={theme}
      onClick={() => setSelectedLot(listing)}
    />
  ))}
</div>
```

---

## 🎯 Summary

**Key Changes:**
1. **Theme**: Fantasy colors → Hunting colors (obsidian, hunter gold, rarity tiers)
2. **Cards**: Add rarity styling based on score tier
3. **Badges**: Map `opportunity_signals` to visual badges
4. **Value**: Display `value_estimate` from backend
5. **Risk**: Show risk level from `risk_signals`
6. **Responsive**: Use CSS classes for media queries
7. **Accessibility**: Add ARIA labels, keyboard nav, focus indicators

**Files to Update:**
- `theme.js` - Replace theme tokens
- `App.jsx` - Update header, add hunt status bar
- `LotList.jsx` - Add rarity styling, badges, value/risk displays
- `LotDetail.jsx` - Enhanced detail modal with signals
- `utils/rarity.js` - NEW file with helper functions
- `components/Badge.jsx` - NEW badge component

**No Backend Changes Required** - Data structure already matches hunting requirements!

---

**Ready to implement! 🚀**
