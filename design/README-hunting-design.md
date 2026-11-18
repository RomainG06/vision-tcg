# 🎯 HUNTING DASHBOARD — Design System Documentation

## 🧭 Overview: "Hunting Dashboard"

A **premium dark-mode interface** for collectors hunting valuable opportunities in the collectible market. Inspired by crypto/trading dashboards, game inventories, mission radars, and collectible marketplaces — but with collector energy, not childish Pokémon aesthetics.

**Theme**: Hunting Dashboard
**Audience**: Serious collectors & traders
**Tone**: Professional, energetic, adventurous
**Aesthetic**: Dark premium + radar energy

---

## 🎨 Color Palette

### Primary Colors
- **Obsidian** `#0A0E27` — Main background void
- **Midnight** `#121633` — Header/elevated surfaces
- **Deep Dark** `#1A1F3A` — Card backgrounds
- **Slate** `#1E2847` — Subtle accents

### Status Colors (Rarity Tiers)
- **Common** `#4B5563` — Standard listings
- **Rare** `#7C3AED` — Good opportunities
- **Epic** `#0EA5E9` — Strong opportunities
- **Legendary** `#FFD700` — Very strong (+ gold glow)
- **Mythique** `#FF1744` — Price anomaly (red alert)

### Accent Colors
- **Hunter Gold** `#E6B85C` — Radar sweep, primary accents
- **Mana Cyan** `#00D9FF` — Energy, highlights
- **Prey Red** `#FF1744` — Alerts, danger
- **Success Green** `#10B981` — Confirmed matches
- **Warning Orange** `#F59E0B` — Caution, verify

### Text Colors
- **Primary** `#F8FAFC` — Headlines, primary text
- **Secondary** `#CBD5E1` — Body text
- **Tertiary** `#94A3B8` — Labels, subtle text
- **Muted** `#64748B` — Disabled, timestamps

---

## 📊 Hunting Concepts & Terminology

All UI labels and concepts use hunting metaphors:

| Concept | Meaning | UI Usage |
|---------|---------|----------|
| **Profil de Chasse** | Hunt Profile | Custom search configuration page |
| **Radar** | Live Detection | Real-time opportunity radar widget |
| **Opportunités** | Detected Listings | Feed of matching items |
| **Niveau de Rareté** | Item Quality Tier | Visual rarity badge (Common→Mythique) |
| **Score d'Opportunité** | Opportunity Score | 0–100 ranking of listing fit |
| **Risque** | Risk Assessment | Low/Medium/High risk indicator |
| **Potentiel** | Value Gain | Estimated profit/return |
| **Alerte** | Notification Trigger | Alert condition configuration |
| **Watchlist** | Saved Items | Tracked listings for later action |
| **Historique** | Hunt History | Past hunts, discoveries, actions |

---

## 📈 Scoring System (0–100)

Each opportunity receives a score based on boosts & exclusions:

### Score Ranges
```
0–39    : Normal          ○  (gray)        — Standard listing, no special interest
40–59   : Intéressant     ◆  (purple)      — Interesting, worth monitoring
60–74   : Rare            ◈  (cyan)        — Good opportunity detected
75–89   : Épique          ★  (gold)        — Strong opportunity
90–100  : Légendaire      ✦  (gold + glow) — Exceptional, contact immediately
MYTHIQUE: Anomalie        ✧  (red + pulse) — Price anomaly, verify urgently
```

### Score Calculation Example (Wizards FR)
```
Base score:                              50
+ Lot ancien (1999–2002):                +20
+ Cartes Holo présentes:                 +15
+ Édition française confirmée:           +12
+ Prix sous marché (−20%):               +18
+ Vendeur proche (< 50km):               +8
────────────────────────────────
FINAL SCORE:                             87 → ÉPIQUE
```

---

## 🏷️ Badge System

Badges communicate key attributes at a glance:

### Badge Types
- **WIZARDS** — Wizards era (base, jungle, fossil, gym, etc.)
- **FR** — French edition confirmed
- **LOT** — Lot/bulk listing
- **HOLO** — Contains holographic cards (with ? if uncertain)
- **SOUS-COTÉ** — Priced below market
- **PROCHE** — Seller nearby (< 50 km)
- **À VÉRIFIER** — Needs verification (condition, authenticity)
- **ENVOI RAPIDE** — Fast shipping available
- **NEUF** — New/sealed condition
- **PSA GRADED** — Professional grading cert
- **1ÈRE ÉD** — First edition
- **CERTIFIÉ** — Authenticity certified
- **TENDANCE** — Trending item

---

## 🃏 Opportunity Card Structure

### Card Anatomy (Legendary Example)
```
┌─ OPPORTUNITÉ FORTE                    Score: 87 ─┐
│                                                    │
│  Lot 150 cartes Pokémon Wizards FR                │
│                                                    │
│  Prix: 80 €                 Valeur estimée: 130–220 € │
│                                                    │
│  Leboncoin · Nice · 0 km · Publié il y a 12 min  │
│                                                    │
│  POURQUOI C'EST INTÉRESSANT:                      │
│  ✓ Lot Wizards détecté                           │
│  ✓ FR probable                                   │
│  ✓ Prix sous marché                              │
│  ✓ Proche                                        │
│                                                    │
│  Risque: MOYEN                                    │
│                                                    │
│  [WIZARDS] [FR] [LOT] [HOLO?] [SOUS-COTÉ] [PROCHE] │
│                                                    │
│  [Voir annonce]        [Ajouter à watchlist]      │
└──────────────────────────────────────────────────┘
```

### Rarity-Based Styling
- **Common**: Gray border, muted shadow
- **Rare**: Purple border, purple glow
- **Epic**: Cyan border, cyan glow
- **Legendary**: Gold border, gold glow, emphasized
- **Mythique**: Red border, pulsing red glow, alert appearance

---

## 🎯 Key UI Sections

### 1. Dashboard Header
- Logo/radar icon + title "HUNTING DASHBOARD"
- Status indicator (Hunt active, alerts count)
- Navigation (Dashboard, Profile, Watchlist, History)

### 2. Left Panel
- **Hunt Profile**: Currently active hunt + quick stats
- **Radar**: Live detection visualization (concentric circles, sweep, targets)
- **Watchlist**: Quick-access saved items
- **Legend**: Target type indicators (Rare, Epic, Legendary, Mythique)

### 3. Main Feed
- **Opportunity Cards**: 3–4 cards per row (desktop)
- **Card Sort**: By score (desc), by date, by type, by source
- **Status Line**: "Chasse Wizards FR lancée | 5 opportunités fortes détectées"

### 4. Hunt Profile Page
- **Profil Name**: Visual card with active hunt details
- **Objectives**: Hunt goal + success metrics
- **Search Criteria**: Comma-separated list of included sets/conditions
- **Exclusions**: List of blacklisted terms (proxy, fake, custom)
- **Boosts**: Weighted sliders showing scoring factors
- **Platforms**: Active search sources (Leboncoin, Vinted, eBay, etc.)
- **Stats**: Total opportunities, conversions, watchlist, avg. gain
- **Actions**: Start hunt, view history, duplicate profile, suspend

### 5. History Ticker
- Timeline of hunt activities
- Green ✓ for found items
- ★ for completed hunts
- ⚠ for suspect/excluded listings
- ◆ for scored opportunities

---

## ✨ Animation & Effects

### Radar Sweep
```css
@keyframes radarSweep {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
animation: radarSweep 4s linear infinite;
```

### Scan Pulse
```css
@keyframes scanPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
animation: scanPulse 1.5s ease-in-out infinite;
```

### Hunt Pulse (Legendary cards)
```css
@keyframes huntPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
}
```

### Score Glow
Glowing text effect on score badges, intensifies on hover.

---

## 📱 Responsive Breakpoints

### Desktop (1440px+)
- 3-column opportunity card grid
- Left sidebar (profile + radar + watchlist)
- Full hunt history ticker
- Radar fully animated

### Tablet (1024px)
- 2-column opportunity card grid
- Left sidebar collapses to icons
- Radar shrinks to mini widget

### Mobile (375px)
- 1-column opportunity card stack
- Sidebar moves to bottom navigation
- Radar moves to collapsible modal
- Hunt history as scrollable list

---

## 🛡️ Do's & Don'ts

### ✅ DO
- Use hunting metaphors consistently (radar, profile, target, prey, etc.)
- Apply rarity colors to ONLY the border/accent, not the whole card
- Show score prominently (top-right of card)
- Make badges scannable (small, monospace font, color-coded)
- Use cyan/gold/red for attention-grabbing elements
- Animate only when necessary (radar sweep, pulse on Legendary)
- Keep dark theme consistent across all screens
- Provide quick-add-to-watchlist action on hover

### ❌ DON'T
- Use bright, childish colors (no lime greens, hot pinks)
- Make cards too cluttered (stick to the anatomy structure)
- Animate every element (causes fatigue)
- Use Comic Sans or playful fonts for body text
- Override rarity colors for individual cards
- Mix hunting metaphors (no "buckets" or "folders")
- Forget to show source/date/location on cards
- Make CTAs hard to find (place at card bottom)

---

## 🎪 Hunting Scenario Example

**User:** "I want to find French Wizards-era Pokémon cards under €100"

**1. Create Hunt Profile ("Wizards FR")**
   - Objectives: Detect undervalued French Wizards
   - Search Criteria: Base Set, Jungle, Fossil, Team Rocket, Gym (1999–2002)
   - Boosts: +20 old lot, +15 holo, +12 FR, +18 undermarket, +8 nearby
   - Exclusions: proxy, fake, custom, PSA/CGC
   - Platforms: Leboncoin, Vinted, eBay

**2. Start Hunt**
   - Radar shows 3 active hunts, 47 total opportunities detected
   - Dashboard displays 5 Opportunités fortes (scores 75–89)

**3. Detect Strong Opportunity**
   - "Lot 150 cartes Pokémon Wizards FR"
   - Score: 87 (Épique tier)
   - Price: €80, Estimated Value: €130–220
   - Badges: WIZARDS, FR, LOT, HOLO?, SOUS-COTÉ, PROCHE
   - Action: Add to Watchlist → Follow up next day

**4. Track & Convert**
   - Watchlist tracks 12 items
   - 16 purchases validated (34% conversion rate)
   - Average gain: €85 per buy

---

## 🚀 Implementation Checklist

- [ ] **Tokens**: Design tokens (colors, typography, spacing, shadows)
- [ ] **Components**: Card, badge, button, radar widget
- [ ] **Pages**: Dashboard, hunt profile, watchlist, history
- [ ] **Animations**: Radar sweep, scan pulse, glow effects
- [ ] **Responsive**: Desktop, tablet, mobile layouts
- [ ] **Accessibility**: Contrast ratios, keyboard nav, alt text
- [ ] **Interactions**: Hover states, add-to-watchlist flow, sorting

---

## 📋 File Structure

```
/design/
├── tokens/
│   └── hunting-tokens.json          ← All design constants
├── assets/
│   ├── logo-hunting-radar.svg       ← Radar icon/logo
│   ├── badge-*.svg                  ← Individual badge icons
│   └── icon-*.svg                   ← Navigation icons
├── mockups/
│   ├── hunting-dashboard.svg        ← Main dashboard (1440×900)
│   ├── hunt-profile.svg             ← Profile config page
│   └── opportunity-card-*.svg       ← Card variants
├── preview-hunting.html             ← Interactive preview
└── README-design.md                 ← This document
```

---

## 💡 Design Philosophy

> **"A serious collector's radar for finding hidden gems. Professional, energetic, adventurous—never cute or childish."**

Think: Bloomberg Terminal meets treasure map meets Pokémon TCG collector's dream. Dark, sophisticated, but with moments of excitement when you find that epic opportunity.

---

**Theme**: Hunting Dashboard  
**Status**: Ready for Implementation  
**Date**: June 2026  
**Version**: 1.0
