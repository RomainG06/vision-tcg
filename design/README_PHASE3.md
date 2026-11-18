# 🎯 Phase 3: Hunting Dashboard UI - START HERE

**Date**: June 15, 2026  
**Status**: ✅ Ready for Implementation  
**Estimated Time**: 3 weeks

---

## 📚 Documentation Index

### **Start Here (Quick Read)**
1. **[PHASE3_QUICK_DECISIONS.md](./PHASE3_QUICK_DECISIONS.md)** ⭐ **READ THIS FIRST**
   - Answers to your 4 key questions
   - 5-minute read
   - Executive summary of all decisions

### **Implementation Guides**
2. **[PHASE3_IMPLEMENTATION_GUIDE.md](./PHASE3_IMPLEMENTATION_GUIDE.md)** 📖 **Detailed Guide**
   - Complete implementation approach
   - Accessibility & responsive requirements
   - 3-week implementation plan
   - Design principles & philosophy

3. **[PHASE3_CODE_EXAMPLES.md](./PHASE3_CODE_EXAMPLES.md)** 💻 **Code Transformations**
   - Before/after code examples
   - Theme.js transformation
   - Component updates
   - Utility functions
   - Badge component
   - Copy-paste ready code

### **Design System Reference**
4. **[README-hunting-design.md](./README-hunting-design.md)** 🎨 **Design System**
   - Full hunting theme documentation
   - Color palette, typography, spacing
   - Scoring system (0-100)
   - Badge types
   - Do's & Don'ts

5. **[tokens/hunting-tokens.json](./tokens/hunting-tokens.json)** 📦 **Design Tokens**
   - All colors, fonts, spacing, shadows
   - Import into theme.js

6. **[preview-hunting.html](./preview-hunting.html)** 👁️ **Interactive Preview**
   - Open in browser to see hunting theme
   - Reference for visual styling

---

## 🚀 Quick Start (5 Steps)

### 1. **Read Quick Decisions** (5 min)
```bash
cat PHASE3_QUICK_DECISIONS.md
```
**Key Decisions:**
- ✅ Replace existing UI (not parallel)
- ✅ Keep inline styles (no new libraries)
- ✅ Cards feed first (defer radar widget)
- ✅ Responsive + accessible required

---

### 2. **Review Code Examples** (15 min)
```bash
cat PHASE3_CODE_EXAMPLES.md
```
**See transformations for:**
- theme.js (Fantasy → Hunting colors)
- App.jsx (header + hunt status)
- LotList.jsx (rarity styling + badges)
- Utility functions (rarity.js)
- Badge component

---

### 3. **Copy Design Tokens** (5 min)
```bash
# Copy hunting tokens to frontend theme
cp tokens/hunting-tokens.json ../frontend/src/hunting-tokens.json

# Or manually copy values into theme.js
```

---

### 4. **Start Week 1: Theme Swap** (1 week)
```bash
cd ../frontend/src

# Update theme.js with hunting colors
# Replace Fantasy → Hunting (obsidian, hunter gold, rarity tiers)
# Test: npm run dev (everything should still work)
```

**Checklist:**
- [ ] Colors: Fantasy → Hunting (obsidian, midnight, deepDark)
- [ ] Typography: Add Outfit (headings), JetBrains Mono (badges)
- [ ] App.jsx header: "Vision Hunting" + hunt status bar
- [ ] Test: All components render without breaking

---

### 5. **Week 2-3: Enhance Components** (2 weeks)
```bash
# Create new files:
touch src/utils/rarity.js
touch src/components/Badge.jsx

# Update existing:
# - LotList.jsx: Add rarity styling, badges, value/risk
# - LotDetail.jsx: Enhanced signals display
# - FilterBar.jsx: Update terminology
```

**Checklist:**
- [ ] Rarity styling (border, glow based on score)
- [ ] Badge system (opportunity_signals → visual badges)
- [ ] Value estimates display
- [ ] Risk indicators
- [ ] Responsive grid (mobile/tablet/desktop)
- [ ] Keyboard navigation + ARIA labels
- [ ] Animations (huntPulse for legendary cards)

---

## ✅ Implementation Checklist

### Week 1: Theme Swap
- [ ] Copy hunting-tokens.json values to theme.js
- [ ] Replace all color references (Fantasy → Hunting)
- [ ] Update typography (Outfit, Inter, JetBrains Mono)
- [ ] Update App.jsx header to "Vision Hunting"
- [ ] Add hunt status bar (active hunt name, opportunity count)
- [ ] Test: npm run dev - everything works

### Week 2: Component Enhancement
- [ ] Create utils/rarity.js with helper functions
- [ ] Create components/Badge.jsx
- [ ] Update LotList.jsx:
  - [ ] Add rarity styling (border, glow)
  - [ ] Display badges from opportunity_signals
  - [ ] Show value_estimate
  - [ ] Show risk_signals
- [ ] Update LotDetail.jsx:
  - [ ] Enhanced signals display
  - [ ] Value breakdown
  - [ ] Risk warnings
- [ ] Update filter terminology to hunting metaphors

### Week 3: Polish & Responsive
- [ ] Add responsive grid (CSS classes + media queries)
- [ ] Add keyboard navigation (tabIndex, onKeyPress, aria-label)
- [ ] Add focus indicators (3px gold outline)
- [ ] Add CSS animations (huntPulse, scoreGlow)
- [ ] Test on:
  - [ ] Chrome, Firefox, Safari
  - [ ] Mobile (375px - iPhone SE)
  - [ ] Tablet (768px - iPad)
  - [ ] Desktop (1440px)
- [ ] Update README with design system docs
- [ ] User testing with Romain

---

## 🎯 Success Criteria

**Phase 3 is complete when:**
- ✅ Dark hunting theme applied (obsidian background)
- ✅ Opportunity cards have rarity-based styling (border, glow)
- ✅ Badges show signals (WIZARDS, FR, LOT, PROCHE, etc.)
- ✅ Value estimates displayed in cards
- ✅ Risk indicators visible
- ✅ Responsive on mobile/tablet/desktop (375px, 768px, 1440px)
- ✅ Accessible (keyboard nav, ARIA labels, WCAG AA contrast)
- ✅ Hunt status bar shows active hunt info
- ✅ Animations work (legendary card pulse)
- ✅ Romain approves the look & feel

---

## 🎨 Design Tokens Quick Reference

### Colors:
```javascript
// Primary
obsidian: '#0A0E27',      // Main background
midnight: '#121633',      // Header
deepDark: '#1A1F3A',      // Cards

// Status (Rarity Tiers)
common: '#4B5563',        // Score 0-39
rare: '#7C3AED',          // Score 40-59
epic: '#0EA5E9',          // Score 60-74
legendary: '#FFD700',     // Score 75-89
mythique: '#FF1744',      // Score 90-100

// Accents
hunterGold: '#E6B85C',    // Primary accent
manaCyan: '#00D9FF',      // Highlights
preyRed: '#FF1744',       // Alerts
successGreen: '#10B981',  // Confirmed
warningOrange: '#F59E0B', // Caution
```

### Score → Rarity Mapping:
```
90-100 → Legendary (gold glow, pulsing animation)
75-89  → Epic (cyan glow)
60-74  → Rare (purple glow)
40-59  → Interesting (purple)
0-39   → Common (gray)
```

### Backend Signals → Badges:
```
opportunity_signals → Visual Badges:
- wizards_detected  → "WIZARDS" (gold, ⭐)
- french_edition    → "FR" (purple, 🇫🇷)
- lot_detected      → "LOT" (cyan, 📦)
- near_location     → "PROCHE" (green, 📍)
- rare_cards        → "HOLO" (gold, ✨)
- below_market      → "SOUS-COTÉ" (orange, 💰)
```

---

## 📊 Backend Data (Already Ready)

**No backend changes needed!** The API already provides:

```javascript
GET /api/listings
{
  id: 123,
  title: "Lot 150 cartes Pokémon Wizards FR",
  price: 80,
  score: 87,
  
  // Signals for badges
  opportunity_signals: [
    "wizards_detected",
    "french_edition",
    "lot_detected",
    "near_location"
  ],
  
  // Risk indicators
  risk_signals: [
    "condition_unclear",
    "incomplete_photos"
  ],
  
  // Value estimates
  value_estimate: {
    min: 130,
    max: 220,
    confidence: "medium"
  },
  
  // AI explanation
  explanation: "Strong opportunity: Wizards era detected..."
}
```

**Frontend just needs to display this data beautifully!**

---

## 🛠️ Tech Stack (No Changes)

**Current Stack (Keep):**
- ✅ React 18 + Vite
- ✅ Inline styles (no CSS-in-JS library)
- ✅ No UI component library

**New Files (Minimal):**
- `utils/rarity.js` - Helper functions (100 lines)
- `components/Badge.jsx` - Badge component (50 lines)
- CSS animations in `<style>` tag (same pattern as current code)

**Libraries to Add:**
- ❌ None! Keep it simple.

---

## 📁 File Structure

```
vision-tcg/
├── design/                          ← You are here
│   ├── README_PHASE3.md            ← This file (START HERE)
│   ├── PHASE3_QUICK_DECISIONS.md   ← Quick summary (read first)
│   ├── PHASE3_IMPLEMENTATION_GUIDE.md  ← Detailed guide
│   ├── PHASE3_CODE_EXAMPLES.md     ← Code transformations
│   ├── README-hunting-design.md    ← Design system docs
│   ├── tokens/
│   │   └── hunting-tokens.json     ← Design constants
│   ├── mockups/
│   │   └── hunting-dashboard.svg   ← Reference mockup
│   └── preview-hunting.html        ← Interactive demo
│
└── frontend/src/
    ├── theme.js                     ← UPDATE: Add hunting tokens
    ├── App.jsx                      ← UPDATE: Header + hunt status
    ├── components/
    │   ├── LotList.jsx             ← UPDATE: Rarity styling
    │   ├── LotDetail.jsx           ← UPDATE: Enhanced signals
    │   ├── FilterBar.jsx           ← UPDATE: Terminology
    │   └── Badge.jsx               ← NEW: Badge component
    └── utils/
        └── rarity.js               ← NEW: Helper functions
```

---

## 🔥 Next Actions (Priority Order)

1. **Read PHASE3_QUICK_DECISIONS.md** (5 min) ⭐
2. **Review PHASE3_CODE_EXAMPLES.md** (15 min)
3. **Open preview-hunting.html** in browser (see target design)
4. **Start Week 1**: Update theme.js with hunting colors
5. **Test frequently**: npm run dev after each change
6. **Week 2**: Add rarity styling + badges
7. **Week 3**: Polish + responsive + accessibility
8. **Demo to Romain**: Get approval for Phase 3

---

## 💡 Design Principles (Remember These)

1. **Professional, not playful** - Dark premium aesthetic (Bloomberg, not cartoon)
2. **Hunting metaphors** - Radar, prey, target, hunt (never "folders" or "buckets")
3. **Rarity communicates value** - Color instantly shows opportunity level
4. **Animations sparingly** - Only radar sweep, legendary card glow
5. **Mobile-first** - Must work perfectly on iPhone SE (375px)
6. **Accessible always** - WCAG AA, keyboard nav, screen readers

---

## ❓ Questions?

**Implementation questions:**
→ See `PHASE3_IMPLEMENTATION_GUIDE.md`

**Code examples:**
→ See `PHASE3_CODE_EXAMPLES.md`

**Design details:**
→ See `README-hunting-design.md`

**Visual reference:**
→ Open `preview-hunting.html` in browser

**Token values:**
→ See `tokens/hunting-tokens.json`

---

## 🎯 Let's Hunt!

**Status**: ✅ Everything is ready  
**Risk**: 🟢 LOW (incremental changes, solid foundation)  
**Confidence**: 🟢 HIGH (design complete, backend ready, clear plan)

**You have everything you need to start implementing Phase 3 right now.**

**Good luck! 🚀**
