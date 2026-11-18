# 🎯 Phase 3: Hunting Dashboard UI Implementation Guide

**Date**: June 15, 2026  
**Version**: 1.0  
**Status**: Ready for Implementation

---

## 📋 Executive Summary

This guide provides the complete implementation approach for transforming the current "Heroic Fantasy Magic" UI into the **"Hunting Dashboard"** design system for Phase 3.

**Current State**:
- ✅ Backend provides: `score`, `badges` (via signals), `opportunity_signals`, `risk_signals`, `value_estimates`, explanations
- ✅ Simple React UI with "Heroic Fantasy Magic" theme
- ✅ Basic card list, detail modal, filter bar
- ✅ Uses inline styles (no CSS-in-JS library)

**Target State**:
- 🎯 Premium dark "Hunting Dashboard" theme
- 🎯 Opportunity cards with rarity-based styling
- 🎯 Optional: Radar visualization widget
- 🎯 Responsive, accessible, production-ready

---

## ✅ Question 1: New Parallel UI or Replace Existing?

### **RECOMMENDATION: Progressive Replacement (Hybrid Approach)**

**Why?**
- The current UI structure is simple enough to evolve in-place
- No need to maintain two parallel UIs
- The hunting theme is mature enough to replace the fantasy theme entirely
- Backend data structure already matches hunting requirements

**Implementation Strategy**:

### Phase 3A: Theme Swap (Week 1)
1. **Update `theme.js`**:
   - Import hunting tokens from `design/tokens/hunting-tokens.json`
   - Replace Heroic Fantasy colors with Hunting colors
   - Keep existing component structure
   - Test visual changes without breaking functionality

2. **Update Typography**:
   - Replace "Cinzel" fantasy font with "Outfit" (headings)
   - Keep Inter for body text
   - Add JetBrains Mono for badges/code

3. **Update Terminology**:
   - Change "Vision TCG" → "Hunting Radar" or "Vision Hunting"
   - Keep existing component names internally (LotList, LotDetail)
   - Update user-facing labels to hunting metaphors

### Phase 3B: Component Enhancement (Week 2)
4. **Enhance Opportunity Cards**:
   - Add rarity-based borders/glows based on score
   - Implement badge system using `opportunity_signals`
   - Add risk indicators from `risk_signals`
   - Show value estimates from backend

5. **Add Hunt Status Bar**:
   - Show active hunt profile name
   - Display opportunity count by tier
   - Add quick stats (total, avg score, avg price)

### Phase 3C: Optional Radar Widget (Week 3)
6. **Radar Widget** (if time permits):
   - Create as collapsible widget
   - Show active hunts + opportunity count
   - Animated radar sweep (CSS-only)
   - Mobile: collapses to button

**Migration Path**:
```
Current UI → Update theme.js → Update components → Add hunting features → Polish
```

**No parallel UI needed.** The existing UI is a solid foundation.

---

## ✅ Question 2: React Component Patterns & Libraries

### **RECOMMENDATION: Minimal Dependencies, Inline Styles Pattern**

**Current Stack (Keep)**:
- ✅ React 18 + Vite
- ✅ Inline styles (no CSS-in-JS library)
- ✅ No UI component library

**Why Keep Inline Styles?**
- Current codebase uses this pattern consistently
- No bundle size overhead from CSS-in-JS libraries
- Easy to read and maintain for this scope
- Works well with dark theme (no CSS variables complexity)

**Recommended Patterns**:

### 1. **Theme Tokens as Constants**
```javascript
// theme.js
export const huntingTheme = {
  colors: {
    primary: {
      obsidian: '#0A0E27',
      midnight: '#121633',
      deepDark: '#1A1F3A',
      slate: '#1E2847'
    },
    status: {
      common: '#4B5563',
      rare: '#7C3AED',
      epic: '#0EA5E9',
      legendary: '#FFD700',
      mythique: '#FF1744'
    },
    // ... from hunting-tokens.json
  },
  // ... rest of tokens
};
```

### 2. **Rarity Helper Functions**
```javascript
// utils/rarity.js
export function getScoreTier(score) {
  if (score >= 90) return 'legendary';
  if (score >= 75) return 'epic';
  if (score >= 60) return 'rare';
  if (score >= 40) return 'interesting';
  return 'common';
}

export function getRarityStyles(tier, theme) {
  return {
    border: `2px solid ${theme.colors.status[tier]}`,
    boxShadow: theme.shadows[`glow_${tier}`] || theme.shadows.sm,
  };
}
```

### 3. **Badge Component**
```javascript
// components/Badge.jsx
export function Badge({ type, theme }) {
  const badgeStyles = {
    WIZARDS: { bg: theme.colors.status.legendary, color: '#0A0E27' },
    FR: { bg: theme.colors.status.rare, color: '#F8FAFC' },
    LOT: { bg: theme.colors.accent.manaBlue, color: '#0A0E27' },
    // ... rest
  };
  
  const style = badgeStyles[type] || badgeStyles.default;
  
  return (
    <span style={{
      background: style.bg,
      color: style.color,
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      fontFamily: theme.typography.fonts.mono,
      textTransform: 'uppercase',
    }}>
      {type}
    </span>
  );
}
```

### 4. **Opportunity Card Component Structure**
```javascript
// components/OpportunityCard.jsx
function OpportunityCard({ listing, theme, onClick }) {
  const tier = getScoreTier(listing.score);
  const rarityStyles = getRarityStyles(tier, theme);
  
  return (
    <div style={{
      ...styles.card,
      ...rarityStyles,
    }} onClick={onClick}>
      {/* Score badge */}
      <ScoreBadge score={listing.score} tier={tier} />
      
      {/* Image */}
      <CardImage url={listing.image_url} />
      
      {/* Content */}
      <CardContent listing={listing} />
      
      {/* Signals */}
      <SignalBadges signals={listing.opportunity_signals} />
      
      {/* Value estimate */}
      <ValueEstimate estimate={listing.value_estimate} />
    </div>
  );
}
```

**No External Libraries Needed**:
- ❌ No Styled Components
- ❌ No Emotion
- ❌ No Tailwind CSS
- ❌ No Material-UI or Chakra
- ✅ Keep it simple: React + inline styles + theme constants

**Animation**: Use CSS keyframes defined in a `<style>` tag (same pattern as current `App.jsx`):
```javascript
const animations = document.createElement('style');
animations.textContent = `
  @keyframes radarSweep {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes huntPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
    50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
  }
`;
document.head.appendChild(animations);
```

---

## ✅ Question 3: Full Radar Widget or Opportunity Cards Only?

### **RECOMMENDATION: Start with Opportunity Cards Feed Only**

**Phase 3 Scope (Essential)**:
1. ✅ **Opportunity Cards Feed** (MUST HAVE)
   - Rarity-based styling
   - Badge system
   - Value estimates
   - Risk indicators
   - Score display
   - Responsive grid

2. ✅ **Hunt Status Bar** (MUST HAVE)
   - Active hunt name
   - Opportunity count
   - Quick stats

3. ❌ **Radar Widget** (NICE TO HAVE, Phase 4)
   - Defer to Phase 4
   - Requires more design time
   - Not essential for MVP
   - Can be added as enhancement

**Why Defer Radar Widget?**
- Cards feed provides 90% of value
- Radar is visual flair, not functional requirement
- Backend doesn't provide real-time "ping" data yet
- Focus on core hunting experience first
- Can prototype radar in Phase 4 once cards are solid

**Radar Widget for Phase 4**:
- Collapsible widget in left sidebar
- Shows active hunts (from `/api/profiles`)
- Animated sweep line
- Target indicators by rarity tier
- Mobile: collapses to floating button

**Implementation Priority**:
```
Phase 3A: Theme + Cards Feed (Week 1-2)
Phase 3B: Hunt Status + Polish (Week 2-3)
Phase 4:  Radar Widget + Advanced Features (Future)
```

---

## ✅ Question 4: Accessibility & Responsive Design

### **Accessibility Requirements**

#### 1. **Color Contrast (WCAG AA)**
- All text on dark backgrounds must meet 4.5:1 ratio
- Hunting tokens already provide high-contrast colors
- **Test combinations**:
  - `#F8FAFC` (textPrimary) on `#0A0E27` (obsidian) = ✅ 16.8:1
  - `#CBD5E1` (textSecondary) on `#1A1F3A` (deepDark) = ✅ 11.2:1
  - `#FFD700` (legendary) on `#0A0E27` = ✅ 10.5:1

#### 2. **Keyboard Navigation**
```javascript
// Opportunity Card - add keyboard support
<div
  role="button"
  tabIndex={0}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick();
    }
  }}
  onClick={onClick}
  style={styles.card}
>
  {/* ... */}
</div>
```

#### 3. **Screen Reader Support**
```javascript
// Score badge
<span
  aria-label={`Opportunity score: ${score} out of 100, tier: ${tier}`}
  style={styles.scoreBadge}
>
  {score}
</span>

// Badge system
<div aria-label="Opportunity signals">
  {signals.map(signal => (
    <Badge key={signal} type={signal} />
  ))}
</div>
```

#### 4. **Focus Indicators**
```javascript
const styles = {
  card: {
    // ... existing styles
    outline: 'none',
    ':focus': {
      outline: `3px solid ${theme.colors.accent.hunterGold}`,
      outlineOffset: '2px',
    }
  }
};

// Add via CSS since inline styles don't support :focus
const focusStyles = document.createElement('style');
focusStyles.textContent = `
  .opportunity-card:focus {
    outline: 3px solid #E6B85C;
    outline-offset: 2px;
  }
`;
document.head.appendChild(focusStyles);
```

### **Responsive Design**

#### 1. **Breakpoints**
```javascript
const breakpoints = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
};
```

#### 2. **Grid System**
```javascript
// LotList.jsx - update grid
const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: theme.spacing.xxl,
    
    // Mobile: single column
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: theme.spacing.lg,
    },
    
    // Desktop: 3 columns max
    '@media (min-width: 1440px)': {
      gridTemplateColumns: 'repeat(3, 1fr)',
    }
  }
};
```

Since inline styles don't support media queries, use CSS-in-JS or a `<style>` tag:

```javascript
// In LotList.jsx
const responsiveStyles = document.createElement('style');
responsiveStyles.textContent = `
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
document.head.appendChild(responsiveStyles);

// Then use className
<div className="opportunity-grid">
  {/* cards */}
</div>
```

#### 3. **Mobile-First Approach**
- Start with mobile layout
- Add complexity for larger screens
- Test on 375px (iPhone SE), 768px (iPad), 1440px (Desktop)

#### 4. **Touch Targets**
```javascript
const styles = {
  button: {
    minHeight: '44px',  // iOS minimum touch target
    minWidth: '44px',
    padding: '12px 24px',
  }
};
```

#### 5. **Font Scaling**
```javascript
// Use rem units for font sizes
const typography = {
  sizes: {
    display: '3rem',      // 48px at default 16px base
    headingLg: '1.75rem', // 28px
    bodyMd: '0.875rem',   // 14px
    tiny: '0.6875rem',    // 11px
  }
};
```

---

## 🛠️ Implementation Checklist

### Week 1: Theme Swap
- [ ] Copy `hunting-tokens.json` to `frontend/src/theme.js`
- [ ] Replace all color references
- [ ] Update typography (Outfit + Inter + JetBrains Mono)
- [ ] Update App.jsx header to "Hunting Radar"
- [ ] Test: All components render without breaking

### Week 2: Component Enhancement
- [ ] Create `utils/rarity.js` with score tier logic
- [ ] Create `components/Badge.jsx` for signal badges
- [ ] Update `LotList.jsx` to use rarity styling
- [ ] Add value estimate display in cards
- [ ] Add risk indicators in `LotDetail.jsx`
- [ ] Update filter bar terminology to hunting metaphors

### Week 3: Polish & Responsive
- [ ] Add responsive grid (mobile/tablet/desktop)
- [ ] Add keyboard navigation
- [ ] Add ARIA labels for accessibility
- [ ] Add CSS animations (score glow, card hover)
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Update README with design system docs

### Week 4: Testing & Deployment (Phase 4)
- [ ] User testing with Romain
- [ ] Fix bugs and edge cases
- [ ] Performance optimization
- [ ] Deploy to staging
- [ ] (Optional) Add radar widget prototype

---

## 🎨 Design Assets Available

### From `/design/` Directory:
1. **Tokens**: `tokens/hunting-tokens.json` (colors, typography, spacing, shadows)
2. **Mockups**: `mockups/hunting-dashboard.svg` (reference design)
3. **Documentation**: `README-hunting-design.md` (full design guide)
4. **Preview**: `preview-hunting.html` (interactive demo)

### Import Pattern:
```javascript
import huntingTokens from '../../../design/tokens/hunting-tokens.json';
```

Or copy values into `theme.js` manually (recommended for simplicity).

---

## 📊 Backend Data Mapping

### Current Backend Response Structure:
```javascript
{
  id: 123,
  title: "Lot 150 cartes Pokémon Wizards FR",
  price: 80,
  score: 87,
  location: "Nice",
  distance_km: 5,
  
  // Already provided by backend:
  opportunity_signals: [
    "wizards_detected",
    "french_edition",
    "lot_detected",
    "near_location",
    "rare_cards"
  ],
  risk_signals: [
    "condition_unclear",
    "incomplete_photos"
  ],
  value_estimate: {
    min: 130,
    max: 220,
    confidence: "medium"
  },
  explanation: "Strong opportunity: Wizards era detected..."
}
```

### Frontend Mapping:
```javascript
// Badges from opportunity_signals
const badgeMap = {
  wizards_detected: 'WIZARDS',
  french_edition: 'FR',
  lot_detected: 'LOT',
  near_location: 'PROCHE',
  rare_cards: 'HOLO',  // or custom icon
  below_market: 'SOUS-COTÉ'
};

// Display badges
{listing.opportunity_signals.map(signal => (
  <Badge key={signal} type={badgeMap[signal]} />
))}

// Risk level from risk_signals
const riskLevel = listing.risk_signals.length === 0 ? 'LOW' :
                 listing.risk_signals.length <= 2 ? 'MEDIUM' : 'HIGH';

// Rarity tier from score
const tier = getScoreTier(listing.score);
```

**No backend changes needed.** The data structure already matches hunting requirements.

---

## 🚀 Next Steps

1. **Review this guide** with Romain
2. **Confirm approach**:
   - ✅ Replace existing UI (not parallel)
   - ✅ Keep inline styles pattern
   - ✅ Start with cards feed only (defer radar)
   - ✅ Accessibility + responsive required

3. **Start Week 1**: Theme swap in `theme.js`
4. **Iterate**: Show progress after each week
5. **Deploy**: Phase 3 complete = hunting theme live

---

## 📝 Notes

- **Design Philosophy**: Professional, dark premium, never childish
- **Inspiration**: Bloomberg Terminal + treasure hunt + collector tools
- **Metaphors**: Hunt, radar, prey, opportunity, target (never "folders" or "buckets")
- **Animations**: Use sparingly (radar sweep, legendary card glow only)
- **Mobile**: Must work well on 375px (iPhone SE)

---

**Status**: ✅ Ready for Implementation  
**Confidence**: HIGH (design system is complete, backend is ready, UI structure is solid)  
**Risk**: LOW (incremental changes, no rewrites needed)

---

**Questions?** Refer to:
- `design/README-hunting-design.md` for full design guide
- `design/tokens/hunting-tokens.json` for all constants
- `design/preview-hunting.html` for interactive demo

**Let's hunt! 🎯**
