import { useState } from 'react';
import theme from '../theme';

function FilterBar({ filters, onChange }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (key, value) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onChange(updated);
  };

  return (
    <div style={styles.container}>
      <div style={styles.filterGroup}>
        <label style={styles.label}>Statut</label>
        <select
          style={styles.select}
          value={localFilters.status}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="all">Tous</option>
          <option value="new">Nouveau</option>
          <option value="interested">Intéressant</option>
          <option value="passed">Passé</option>
          <option value="contacted">Contacté</option>
        </select>
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>
          Score minimum: {localFilters.minScore}
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          style={styles.range}
          value={localFilters.minScore}
          onChange={(e) => handleChange('minScore', parseInt(e.target.value))}
        />
        <div style={styles.rangeLabels}>
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Prix max (€)</label>
        <input
          type="number"
          min="0"
          step="50"
          placeholder="Ex: 1500"
          style={styles.input}
          value={localFilters.maxPrice}
          onChange={(e) => handleChange('maxPrice', parseInt(e.target.value) || 0)}
        />
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Distance max (km)</label>
        <input
          type="number"
          min="0"
          step="5"
          placeholder="Ex: 50"
          style={styles.input}
          value={localFilters.maxDistance}
          onChange={(e) => handleChange('maxDistance', parseInt(e.target.value) || 0)}
        />
      </div>

      <div style={styles.actions}>
        <button
          style={styles.resetButton}
          onClick={() => {
            const defaults = {
              status: 'all',
              minScore: 0,
              maxPrice: 1500,
              maxDistance: 50,
            };
            setLocalFilters(defaults);
            onChange(defaults);
          }}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: theme.colors.neutral.bgCard,
    border: `${theme.borders.widthMedium} solid ${theme.colors.primary.arcanePurpleLight}`,
    borderRadius: theme.borders.radiusLg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xxxl,
    boxShadow: theme.shadows.md,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: theme.spacing.lg,
    alignItems: 'end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.accent.enchantGold,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  select: {
    padding: theme.spacing.md,
    background: theme.colors.neutral.bgHover,
    color: theme.colors.neutral.textPrimary,
    border: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontFamily: theme.typography.fonts.primary,
    transition: `all ${theme.effects.transitionNormal}`,
    cursor: 'pointer',
  },
  input: {
    padding: theme.spacing.md,
    background: theme.colors.neutral.bgHover,
    color: theme.colors.neutral.textPrimary,
    border: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontFamily: theme.typography.fonts.primary,
    transition: `all ${theme.effects.transitionNormal}`,
  },
  range: {
    width: '100%',
    height: '8px',
    background: theme.colors.neutral.bgHover,
    border: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
    borderRadius: theme.borders.radiusSm,
    outline: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
  },
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: theme.typography.sizes.tiny,
    color: theme.colors.neutral.textSecondary,
    marginTop: `-${theme.spacing.xs}`,
  },
  actions: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  resetButton: {
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    background: theme.colors.neutral.bgHover,
    color: theme.colors.neutral.textSecondary,
    border: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fonts.primary,
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionNormal}`,
    width: '100%',
  },
};

// Add focus styles via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  select:focus, input:focus {
    outline: none;
    border-color: ${theme.colors.accent.manaBlue} !important;
    box-shadow: ${theme.shadows.glowMana};
  }
  
  select:hover, input:hover {
    border-color: ${theme.colors.primary.arcanePurpleLight};
  }
  
  button:hover {
    background: ${theme.colors.primary.arcanePurpleLight} !important;
    color: ${theme.colors.neutral.textPrimary} !important;
    border-color: ${theme.colors.primary.arcanePurpleLight} !important;
    box-shadow: ${theme.shadows.glowMagic};
  }
  
  /* Range slider thumb */
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, ${theme.colors.accent.manaBlue}, ${theme.colors.primary.arcanePurpleLight});
    border-radius: 50%;
    cursor: pointer;
    box-shadow: ${theme.shadows.glowMana};
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, ${theme.colors.accent.manaBlue}, ${theme.colors.primary.arcanePurpleLight});
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: ${theme.shadows.glowMana};
  }
`;
document.head.appendChild(styleSheet);

export default FilterBar;
