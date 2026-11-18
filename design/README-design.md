# Vision TCG — Design System "Heroic Fantasy Magic"

## 🧙‍♂️ Design Vision

**Modern Interface + Heroic Fantasy Magic** — A contemporary, clean UI with mystical, pixelated magical elements woven throughout. Think modern SaaS meets a wizard's grimoire.

- **Foundation**: Sleek, modern aesthetic (Stripe/Linear inspired) for usability
- **Magic Layer**: Glowing runes, arcane borders, crystalline effects, pixel sparkles
- **Tone**: Professional yet enchanted, sophisticated with moments of wonder
- **Theme**: Heroic fantasy world — swords, grimoires, crystals, crowns, ancient runes

---

## 🎨 Color Palette

### Primary Magic Colors
- **Deep Blue** (`#0B3D91`) — Main brand, arcane core, trust
- **Arcane Purple** (`#5B21B6`, `#7C3AED`) — Mystical borders, magical glows
- **Mana Cyan** (`#00D9FF`, `#39A0A6`) — Life force, magical energy, highlights

### Accent / Rune Colors
- **Parchment Gold** (`#D4AF37`, `#D4AF37`) — Runes, decorative elements, premium
- **Enchant Gold** (`#FFD700`, `#FFB700`) — Glow effects, magical sparkles, prices
- **Rune Glow** (`#FFB700`) — Enchantment traces, subtle shimmer

### Dark / Void Colors
- **Dark BG** (`#0F1419`) — Main background void
- **Card BG** (`#1A2332`) — Card surfaces, elevated
- **Hover State** (`#252E3E`) — Interactive
- **Void Edge** (`#1A1F3A`) — Border, depth

### Status / Rarity
- **Legendary** (`#FFD700`) — Highest tier items
- **Epic** (`#7C3AED`) — Purple mystical items
- **Rare** (`#00D9FF`) — Cyan enchanted items
- **Success** (`#10B981`), **Warning** (`#F59E0B`), **Error** (`#EF4444`)

---

## 📝 Typography

### Fonts
- **Primary**: `Inter` / `Helvetica Neue` — clean, modern body text
- **Secondary**: `SF Pro Display` / system-ui — headings
- **Fantasy**: `Cinzel` / `Georgia` — titles, dramatic moments (hero titles, runes)
- **Monospace**: `JetBrains Mono` — data, code, technical info
- **Pixel** (accent only): `Press Start 2P` — NEVER in main UI, reserved for special badges

### Scale
- **Display** (48px) — Hero titles with fantasy font
- **Heading XL** (36px) — Page titles (Cinzel serif)
- **Heading MD** (24px) — Section headers
- **Body LG** (16px) — Main content
- **Body MD** (14px) — Primary text
- **Tiny** (11px) — Metadata, captions
- **Pixel SM** (10px) — Micro-elements only

---

## ✨ Magical Effects & Filters

### Glow Effects
```
glow-mana: 0 0 16px rgba(0, 217, 255, 0.6)      /* Cyan mystical aura */
glow-rune: 0 0 16px rgba(255, 183, 0, 0.5)      /* Gold enchantment */
glow-magic: 0 0 24px rgba(124, 58, 237, 0.6)    /* Purple arcane */
```

### Transitions (CSS)
```
transition-magic: 500ms cubic-bezier(0.34, 1.56, 0.64, 1)  /* Bouncy, magical */
pixel-flicker: pixelFlicker 0.15s steps(2, end) infinite   /* Pixel shimmer */
glow-pulse: glowPulse 2s ease-in-out infinite               /* Breathing glow */
mana-float: manaFloat 3s ease-in-out infinite               /* Float effect */
```

---

## 🛡️ Components

### Cards (Enchanted)
- **Background**: Card BG with arcane border (Arcane Purple `#7C3AED`)
- **Border**: 2px, glowing (use `glow-magic` filter)
- **Inner Border**: 1px subtle (Border color)
- **Border-radius**: 8–12px
- **Shadow**: Glow effect + `lg` shadow (0 8px 24px rgba(0,0,0,0.5))
- **Content Padding**: 16px
- **Magical Accents**:
  - Top-left + top-right + bottom corners: Gold rune lines (2–3px segments)
  - Pixel divider in content (small squares, Arcane Purple, 50% opacity)
  - Eye logo micro-icon in top-right (6px cyan circle)

### Button (CTA) — The Grimoire
- **Primary**: Arcane Purple background, gold text
- **Background**: `#7C3AED` or `#5B21B6`
- **Text**: Gold (`#FFD700`), 16px, weight 600
- **Border**: 1.5px `#D4AF37` glow effect
- **Border-radius**: 8px (slightly angular for heroic feel, not fully rounded)
- **Padding**: 12px 24px
- **Hover**: +1 shadow level, glow intensity +0.2, scale 1.02
- **Active**: Pixel flicker effect (subtle)

### Search Bar (Arcane)
- **Background**: Hover State (`#252E3E`)
- **Border**: 1.5px Arcane Purple (`#7C3AED`), 50% opacity
- **Border-radius**: 20px (pill)
- **Height**: 40px (desktop) / 40px (mobile)
- **Glow**: `glow-magic` filter on focus
- **Icon**: Prefix with 🔮 emoji or crystal SVG
- **Placeholder**: Light text, 50% opacity

### Header (Arcane Court)
- **Height**: 80px (desktop) / 60px (mobile)
- **Background**: Card BG (`#1A2332`)
- **Border**: Bottom border 2px Arcane Purple, 50% opacity + glow effect
- **Glow Line Below**: Cyan (`#00D9FF`), 1px, 30% opacity
- **Logo Area**: Eye logo (see below) + Brand name (Cinzel font, 24px, glowing)
- **Rune Decorations**: Small gold pixel squares below title (50% opacity)

### Eye Logo (Hero, Mystical)
- **Base**: Modern ellipse eye shape
- **Iris**: Gradient (Mana Cyan → Deep Blue → Arcane Purple)
- **Pupil**: Void-dark (`#050A27`)
- **Glow**: `feGaussianBlur` + radial glow rings
- **Light Reflection**: Cyan accent (`#00D9FF`), secondary gold (`#FFD700`)
- **Outer Corners**: 4 gold rune lines (2–3px segments each)
- **Micro Glyph Details**: Pixelated gold/cyan dots in corners (50–80% opacity)
- **Outer Rings**: Thin concentric circles (Mana Cyan + Arcane Purple, very subtle)

### Pixel Accent Elements (Heroic, Not Overwhelming)
- **Placement**: Card corners, dividers, icon accents, button edges
- **Style**: Rune lines (angular, 2–3px segments) + micro-squares (2×2px)
- **Colors**: Gold (`#D4AF37`) at 40–70% opacity, Arcane Purple (`#7C3AED`) at 40–60%
- **Rule**: Max 5–6 pixel elements per major section; if you count more, reduce

### Icons (Heroic Fantasy SVG)
New custom icons replace generic symbols:
- **Home**: Sword (Mana Cyan gradient, glowing blade)
- **Search**: Crystal (Purple gradient, faceted, magical sparkles)
- **Add**: Grimoire (Red leather book, gold runes, glowing plus symbol)
- **Messages**: Scroll (Brown parchment, wax seal, written runes)
- **Profile**: Crown (Gold base, cyan/purple jewels, glowing)

All icons feature:
- Gradient fills (2–3 colors)
- Glow effects (feGaussianBlur)
- Sparkle dots around perimeter (50–70% opacity)
- Pixelated micro-details (2×2 squares)

---

## 📐 Spacing & Layout

### Modular 4px Grid
- `xs` (4px), `sm` (8px), `md` (12px), `lg` (16px)
- `xl` (24px), `xxl` (32px), `xxxl` (48px)

### Desktop (1440px)
- Outer margin: 48px
- Card width: 400px
- Grid: 3 columns
- Gap: 24px between cards
- Card height: 280px

### Mobile (375px)
- Outer margin: 12px
- Card width: 351px (full-width, single column)
- Gap: 16px between cards
- Card height: 240px
- Bottom nav height: 60px (fixed)

---

## 🌌 Visual Hierarchy

### Emphasis Levels
1. **Hero Title** (Cinzel, 48px, glowing effect) — Page primary action/goal
2. **Section Header** (Cinzel, 24–36px, subtle glow)
3. **Card Title** (Inter, 16px bold, high contrast)
4. **Price** (Inter, 22px, gold glow, pixel sparkles nearby)
5. **Body Text** (Inter, 14px, secondary color)
6. **Metadata** (Inter, 11–12px, tiny, low contrast)

### Glow Hierarchy
- **Strongest**: Hero titles, primary CTAs, prices (legendary items)
- **Medium**: Card borders, section headers, rare items
- **Subtle**: Dividers, secondary accents, common items

---

## 🎭 Shadows & Depth

### Shadow Layers
```json
{
  "sm": "0 1px 2px rgba(0, 0, 0, 0.3)",
  "md": "0 4px 12px rgba(0, 0, 0, 0.4)",
  "lg": "0 8px 24px rgba(0, 0, 0, 0.5)",
  "xl": "0 16px 32px rgba(0, 0, 0, 0.6)"
}
```

- **Sm**: Subtle separations, micro-UI
- **Md**: Default for cards, buttons
- **Lg**: Elevated surfaces, modals, overlays
- **Xl**: Maximum depth, special features

### Glow Shadows (Magic)
Add `glow-mana`, `glow-rune`, or `glow-magic` to any interactive element on hover.

---

## 🌙 Dark Mode (Default)

All designs are **dark mode first**. Every color is tuned for dark backgrounds with high contrast.

If light mode is needed:
- Invert backgrounds (`#F8F9FA` → BG, `#0F1419` → text)
- Keep colors the same (Deep Blue, Gold, Cyan, Purple maintain brand)
- Borders become `#E5E7EB` (very light)
- Glows become more subtle (reduce opacity by 30%)

---

## 🎪 Rarity Tiers (Card Status)

Use these for item rarity/quality badges:

- **Legendary** (`#FFD700`) — Hero light, max glow
- **Epic** (`#7C3AED`) — Purple glow, arcane feel
- **Rare** (`#00D9FF`) — Cyan glow, enchanted feel
- **Uncommon** (`#47562B` olive) — Subtle, less shine
- **Common** (`#B8BCC4` gray) — Neutral, no glow

Always pair with a label (e.g., "⭐ RARE", "👑 LEGENDARY") and icon.

---

## ✅ Do's and Don'ts

### ✅ DO
- Use pixel accents for micro-details (corners, dividers, sparkles)
- Add glow effects to interactive elements (buttons, links, inputs)
- Apply gold to prices and premium elements
- Use Cinzel font for hero titles and dramatic moments
- Test contrast: 4.5:1 minimum for WCAG AA
- Layer borders (outer arcane, inner subtle) for depth
- Include micro-sparkle dots around icons/logos

### ❌ DON'T
- Overuse pixel elements (max 5–6 per section)
- Use serif fonts (Cinzel, Georgia) in body text
- Mix mana-cyan + arcane-purple in the same element (choose one per context)
- Create rounded corners > 12px (breaks heroic angular feel)
- Add gratuitous shadows everywhere (use sparingly, let glow do the work)
- Use bright neon colors directly (always tone down opacity 40–60%)
- Add sound effects or animations that feel gamey (keep professional tone)

---

## 🛠️ Implementation Notes

### CSS Animations (Template)
```css
@keyframes pixelFlicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes glowPulse {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.6)); }
  50% { filter: drop-shadow(0 0 16px rgba(124, 58, 237, 0.9)); }
}

@keyframes manaFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}
```

### SVG Filters (Reusable)
```svg
<defs>
  <filter id="eyeGlow">
    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
    <feMerge>
      <feMergeNode in="coloredBlur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
</defs>
```

### Tokens.json Integration
All values exported to `tokens/tokens.json` for Tailwind/CSS config:
- Colors with RGB fallbacks
- Typography stack
- Spacing scale
- Shadow definitions
- Effect/animation names

---

## 📦 Asset Inventory

```
design/
├── tokens/
│   └── tokens.json                    # All design tokens
├── assets/
│   ├── logo-eye.svg                   # Hero eye (128×128, gradients + glows)
│   ├── logo-eye.png                   # PNG version
│   ├── eye-symbol-16.svg              # Favicon (16×16, pixel style)
│   ├── card-template.svg              # Card component (320×200)
│   ├── icon-home-sword.svg            # Sword icon (64×64)
│   ├── icon-search-crystal.svg        # Crystal icon (64×64)
│   ├── icon-add-grimoire.svg          # Grimoire icon (64×64)
│   ├── icon-messages-scroll.svg       # Scroll icon (64×64)
│   ├── icon-profile-crown.svg         # Crown icon (64×64)
│   └── [...more icons as needed...]
├── mockups/
│   ├── hero-screen.svg                # Desktop 1440×900
│   ├── hero-screen-mobile.svg         # Mobile 375×812
│   └── [...other screens...]
└── README-design.md                   # This file

```

---

## 🎯 Next Steps for Engineering

1. **Import tokens.json** → Tailwind config or CSS custom properties
2. **Build card component** → Use `card-template.svg` as reference
3. **Implement icons** → SVG sprites or individual imports
4. **Set up responsive grid** → Desktop 3-col, mobile 1-col
5. **Add animations**:
   - Card hover: +glow, scale(1.02)
   - Button hover: pixel-flicker + glow-pulse
   - Eye logo: mana-float + glow-pulse on hover
   - Price badges: glow-pulse always active
6. **Deploy SVG filters** → Use in global stylesheet
7. **Set favicon** → `eye-symbol-16.svg`
8. **Load fonts**: `Inter`, `Cinzel` (Google Fonts or Typekit)

---

## 🎪 Questions?

Refer to `tokens/tokens.json` for exact RGB/hex values.
Check mockups (desktop/mobile SVG) for component composition.
Ask design team for animation details or brand questions.

**Theme**: Heroic Fantasy Magic — Professional, Enchanted, Timeless.

**Last Updated**: June 14, 2026
