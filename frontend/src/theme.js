/**
 * Hunting Dashboard Design System
 * Based on design/tokens/hunting-tokens.json
 * Premium dark-mode interface for collectors hunting valuable opportunities
 */

export const theme = {
  colors: {
    primary: {
      obsidian: '#0A0E27',      // Main background void
      midnight: '#121633',      // Header/elevated surfaces
      deepDark: '#1A1F3A',      // Card backgrounds
      slate: '#1E2847',         // Subtle accents
    },
    status: {
      common: '#4B5563',        // Standard listings (score 0-39)
      rare: '#7C3AED',          // Good opportunities (score 40-59)
      epic: '#0EA5E9',          // Strong opportunities (score 60-74)
      legendary: '#FFD700',     // Very strong (score 75-89) + gold glow
      mythique: '#FF1744',      // Price anomaly (score 90-100) red alert
    },
    text: {
      primary: '#F8FAFC',       // Headlines, primary text
      secondary: '#CBD5E1',     // Body text
      tertiary: '#94A3B8',      // Labels, subtle text
      muted: '#64748B',         // Disabled, timestamps
    },
  },
  // Direct export for convenience (avoid theme.colors.accents.hunterGold verbosity)
  accents: {
    hunterGold: '#E6B85C',    // Radar sweep, primary accents
    manaCyan: '#00D9FF',      // Energy, highlights
    preyRed: '#FF1744',       // Alerts, danger
    successGreen: '#10B981',  // Confirmed matches
    warningOrange: '#F59E0B', // Caution, verify
  },
  typography: {
    fonts: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      heading: "'Outfit', 'Inter', sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    },
    sizes: {
      display: '48px',
      headingXl: '36px',
      headingLg: '28px',
      headingMd: '24px',
      headingSm: '18px',
      bodyLg: '16px',
      bodyMd: '14px',
      bodySm: '13px',
      tiny: '11px',
      monoSm: '12px',
    },
    weights: {
      bold: 700,
      semibold: 600,
      medium: 500,
      normal: 400,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },
  borders: {
    radiusSm: '4px',
    radiusMd: '8px',
    radiusLg: '12px',
    widthThin: '1px',
    widthMedium: '2px',
    widthThick: '3px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 12px rgba(0, 0, 0, 0.6)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.7)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.8)',
    glowRare: '0 0 20px rgba(124, 58, 237, 0.4)',
    glowEpic: '0 0 20px rgba(14, 165, 233, 0.4)',
    glowLegendary: '0 0 20px rgba(255, 215, 0, 0.3)',
    glowMythique: '0 0 20px rgba(255, 23, 68, 0.5)',
  },
  effects: {
    transitionFast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionNormal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionSmooth: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

/**
 * Score → Rarity Level Mapping
 * Used to determine card border, glow, and styling
 */
export const getRarityLevel = (score) => {
  if (score >= 90) return 'mythique';    // Exceptional - contact immediately
  if (score >= 75) return 'legendary';   // Strong opportunity
  if (score >= 60) return 'epic';        // Good opportunity detected
  if (score >= 40) return 'rare';        // Interesting, worth monitoring
  return 'common';                        // Standard listing, no special interest
};

/**
 * Rarity Display Labels (French)
 */
export const rarityLabels = {
  mythique: '💎 OPPORTUNITÉ EXCEPTIONNELLE',
  legendary: '🔥 TRÈS INTÉRESSANT',
  epic: '⭐️ INTÉRESSANT',
  rare: '◆ À SURVEILLER',
  common: '○ STANDARD',
};

/**
 * Badge Label Mapping (opportunity_signals → UI badge text)
 * Using direct color values to avoid circular reference
 */
export const badgeLabels = {
  wizards_detected: { text: 'WIZARDS', color: '#E6B85C', emoji: '🔥' },
  french_edition: { text: 'FR', color: '#7C3AED', emoji: '🇫🇷' },
  lot_detected: { text: 'LOT', color: '#0EA5E9', emoji: '📦' },
  near_location: { text: 'PROCHE', color: '#10B981', emoji: '📍' },
  rare_cards: { text: 'RARES', color: '#F59E0B', emoji: '✨' },
  holographic: { text: 'HOLO', color: '#00D9FF', emoji: '🌟' },
  below_market: { text: 'SOUS-COTÉ', color: '#F59E0B', emoji: '💸' },
};

export default theme;
