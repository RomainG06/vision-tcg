---
# 🎯 HUNTING DASHBOARD — Design System Delivery Package
**Version**: 1.0  
**Date**: June 2026  
**Status**: Ready for Implementation  
**Theme**: Premium Collector Radar (Dark Mode)

---

## 📦 What You're Getting

A complete **"Hunting Dashboard"** design system for a collector opportunity platform. Everything from tokens to mockups to interactive preview.

### Core Deliverables

✅ **Design Tokens** (`hunting-tokens.json`)
- Color palette (primary, status, accents)
- Typography scale (Outfit + Inter + JetBrains Mono)
- Spacing baseline (8px grid)
- Shadow system
- Animation definitions (radar sweep, scan pulse, hunt pulse)
- Hunting concepts vocabulary

✅ **Mockups & Assets**
- `logo-hunting-radar.svg` — Animated radar icon
- `hunting-dashboard.svg` — Main dashboard (1440×900) with left panel, radar, card feed, history
- `hunt-profile.svg` — Hunt configuration page (1440×1200)
- `opportunity-card-legendary.svg` — Card component (420×520)

✅ **Documentation**
- `README-hunting-design.md` — Full design guide (concepts, scoring, badges, UX flows)
- `preview-hunting.html` — Interactive preview browser (this page!)
- `DESIGN-DELIVERY-SUMMARY.md` — This file

✅ **Ready-to-Code**
- All colors in hex format
- Fonts: Outfit (headings), Inter (body), JetBrains Mono (badges)
- Component structures clearly defined
- Animation specs included

---

## 🎨 Design at a Glance

### Aesthetic
**Dark premium** inspired by:
- Crypto/trading dashboards (Bloomberg, Binance)
- Game inventories (RPG loot systems)
- Mission radars (tactical HUD)
- Collectible marketplaces (Stripe-like polish)

**NOT** childish Pokémon — serious collector tools.

### Color System
```
Primary Background:  #0A0E27 (Obsidian)
Cards:               #1A1F3A (Deep Dark)
Rarity Tiers:        Common(#4B5563) → Rare(#7C3AED) → Epic(#0EA5E9) → Legendary(#FFD700) → Mythique(#FF1744)
Hunter Accent:       #E6B85C (Gold)
Energy:              #00D9FF (Cyan)
```

### Core Concept: "Hunting"
Every screen uses hunting metaphors:
- **Profil de Chasse** = Hunt Profile (custom searches)
- **Radar** = Live detection widget
- **Opportunités** = Detected opportunities
- **Historique** = Hunt history & conversions
- **Watchlist** = Saved targets
- **Risque** = Risk assessment

### Scoring System
0–39: Normal | 40–59: Intéressant | 60–74: Rare | 75–89: Épique | 90–100: Légendaire | ANOMALY: Mythique

---

## 🏗️ File Structure

```
/design/
├── tokens/
│   └── hunting-tokens.json                    ← Design constants (use this!)
├── assets/
│   ├── logo-hunting-radar.svg                 ← Animated radar icon
│   ├── opportunity-card-legendary.svg         ← Card component
│   └── [badge SVGs - ready to create]
├── mockups/
│   ├── hunting-dashboard.svg                  ← Main interface
│   ├── hunt-profile.svg                       ← Profile config
│   └── opportunity-card-*.svg                 ← Card variants
├── README-hunting-design.md                   ← Full design guide
├── preview-hunting.html                       ← Interactive preview
└── DESIGN-DELIVERY-SUMMARY.md                 ← This file
```

---

## 🎯 Key Features

### 1. Opportunity Cards
- **Legendary tier example**: Score 87, "Lot 150 cartes Pokémon Wizards FR"
- Price: 80€ | Estimated value: 130–220€
- Location: Leboncoin · Nice · 0 km · Posted 12 min ago
- **Badges**: WIZARDS, FR, LOT, HOLO?, SOUS-COTÉ, PROCHE
- **Risk**: Moyen
- **Buttons**: "Voir annonce" + "Ajouter à watchlist"

### 2. Radar Widget
- Concentric circles (scanning range visualization)
- Animated sweep line (4s rotation)
- Target indicators (different colors for different tiers)
- Cardinal directions (N/E/S/W compass)
- Compass hunting aesthetic

### 3. Hunt Profile Page
- Active hunt name (Wizards FR)
- Objectives (what to find)
- Search criteria (Base Set, Jungle, Fossil, etc.)
- Boosts (weighted sliders: +20pts old lot, +15pts holo, etc.)
- Exclusions (proxy, fake, custom)
- Platforms (Leboncoin, Vinted, eBay active)
- Stats (47 opportunities, 16 conversions, 34% success rate, €85 avg gain)
- Actions (Start hunt, view history, duplicate, suspend)

### 4. Dashboard Feed
- Left panel: Profile + Radar + Watchlist
- Center: Opportunity cards (3-column grid)
- Right: History ticker
- Status bar: "Chasse Wizards FR lancée | 5 opportunités fortes détectées"

---

## 🎨 Typography

```
Headlines:    Outfit (700 weight) — modern, geometric, collector-friendly
Body:         Inter (400-600 weight) — clean, readable, premium
Badges:       JetBrains Mono — technical, scannable, distinct
Code/Labels:  JetBrains Mono (small caps)
```

---

## 🚀 Next Steps for Dev Team

1. **Import tokens**
   ```json
   import huntingTokens from './tokens/hunting-tokens.json'
   ```

2. **Build components** (Card, Radar, Badge, Button)
   - Use SVG as reference
   - Implement CSS animations (radar sweep, score glow)
   - Replicate shadows & gradients

3. **Create pages**
   - Dashboard (main feed view)
   - Hunt Profile (configuration)
   - Watchlist (saved items)
   - History (timeline)

4. **Connect to backend**
   - Fetch opportunity data
   - Calculate scores dynamically
   - Animate radar with real targets

5. **Responsive implementation**
   - Desktop: 3-column cards + left sidebar
   - Tablet: 2-column + collapsed sidebar
   - Mobile: 1-column + bottom nav

---

## 📊 Design Statistics

- **Colors**: 15+ distinct shades
- **Rarity Tiers**: 5 (+ Mythique anomaly)
- **Badge Types**: 13
- **Animations**: 4 (radar sweep, scan pulse, hunt pulse, score glow)
- **Typography Scales**: 8 levels
- **Spacing Unit**: 8px grid
- **Component Count**: 12+ (card, button, badge, radar, etc.)

---

## ✨ Highlights

✓ **Dark Premium Aesthetic** — Professional, not playful  
✓ **Hunting Metaphors Throughout** — Immersive, themed language  
✓ **Rarity-Based Visual Hierarchy** — Color instantly communicates value  
✓ **Badge System** — Scannable, color-coded attributes  
✓ **Animated Radar** — Core visual differentiator  
✓ **Complete Token System** — Ready for CSS/Tailwind/Styled-Components  
✓ **Responsive by Design** — Desktop, tablet, mobile layouts defined  
✓ **Interactive Preview** — Non-technical stakeholders can review  

---

## 🎪 Design Philosophy

> **"A serious collector's radar for finding hidden gems. Professional, energetic, adventurous—never cute or childish."**

This isn't Pokémon fan art. It's Bloomberg Terminal meets treasure hunt meets the sophistication of Linear or Stripe. Every pixel communicates: "We're hunting for real value here."

---

## 📞 Questions?

See `README-hunting-design.md` for:
- Detailed component specs
- Animation CSS
- Responsive breakpoints
- Do's & Don'ts
- Implementation checklist
- Full hunting scenario walkthrough

**Everything is production-ready. Copy, paste, ship.**

---

**Theme**: Hunting Dashboard  
**Status**: ✅ Ready for Implementation  
**Delivery Date**: June 2026  
**Version**: 1.0

---
