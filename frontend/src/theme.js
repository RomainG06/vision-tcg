/**
 * Heroic Fantasy Magic Design System
 * Based on design/tokens/tokens.json
 */

export const theme = {
  colors: {
    primary: {
      deepBlue: '#0B3D91',
      deepBlueLight: '#1E5BA8',
      arcanePurple: '#5B21B6',
      arcanePurpleLight: '#7C3AED',
    },
    accent: {
      parchmentGold: '#D4AF37',
      goldLight: '#E8C547',
      enchantGold: '#FFD700',
      manaBlue: '#00D9FF',
      manaPurple: '#C77DFF',
    },
    neutral: {
      bgDark: '#0F1419',
      bgCard: '#1A2332',
      bgHover: '#252E3E',
      textPrimary: '#F8F9FA',
      textSecondary: '#B8BCC4',
      border: '#2A3347',
      borderLight: '#3A4557',
      borderArcane: '#7C3AED',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      legendary: '#FFD700',
      epic: '#7C3AED',
      rare: '#00D9FF',
    },
    magic: {
      runeGlow: '#FFB700',
      manaGlow: '#00D9FF',
      voidDark: '#0A0E27',
      voidEdge: '#1A1F3A',
    },
  },
  typography: {
    fonts: {
      primary: "'Inter', 'Helvetica Neue', sans-serif",
      fantasy: "'Cinzel', 'Georgia', serif",
      monospace: "'JetBrains Mono', 'Courier New', monospace",
    },
    sizes: {
      display: '48px',
      headingXl: '36px',
      headingLg: '28px',
      headingMd: '24px',
      headingSm: '18px',
      bodyLg: '16px',
      bodyMd: '14px',
      bodySm: '12px',
      tiny: '11px',
    },
    weights: {
      bold: 700,
      semibold: 600,
      normal: 400,
      light: 300,
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
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.6)',
    glowMana: '0 0 16px rgba(0, 217, 255, 0.6)',
    glowRune: '0 0 16px rgba(255, 183, 0, 0.5)',
    glowMagic: '0 0 24px rgba(124, 58, 237, 0.6)',
  },
  effects: {
    transitionFast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionNormal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionMagic: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export default theme;
