import { useEffect, useMemo, useState } from 'react';
import theme from '../theme';
import TcgIcon from './TcgIcon';
import { getCardsForSeries, getTargetSeriesLabel } from '../data/cardTargets';

function sameSelection(a = [], b = []) {
  return a.map(item => item.id).sort().join('|') === b.map(item => item.id).sort().join('|');
}

export default function TargetCardsModal({ isOpen, selectedSeries, selectedTargets = [], onClose, onApply }) {
  const [draftTargets, setDraftTargets] = useState(selectedTargets);
  const [search, setSearch] = useState('');
  const seriesLabel = getTargetSeriesLabel(selectedSeries);

  useEffect(() => {
    if (!isOpen) return;
    setDraftTargets(selectedTargets);
    setSearch('');
  }, [isOpen, selectedSeries, selectedTargets]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const cards = getCardsForSeries(selectedSeries);
  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(card => [card.name, card.number, ...(card.aliases || [])]
      .join(' ')
      .toLowerCase()
      .includes(q));
  }, [cards, search]);

  if (!isOpen) return null;

  const selectedIds = new Set(draftTargets.map(target => target.id));
  const toggleTarget = (target) => {
    setDraftTargets(prev => selectedIds.has(target.id)
      ? prev.filter(item => item.id !== target.id)
      : [...prev, target]);
  };

  const apply = () => {
    onApply?.({ series: selectedSeries, targets: draftTargets });
  };

  return (
    <div style={styles.overlay} onMouseDown={onClose}>
      <style>{responsiveCss}</style>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="target-cards-title"
        className="target-modal"
        style={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Ciblage scraping</div>
            <h2 id="target-cards-title" style={styles.title}>Configurer les cibles de chasse</h2>
            <p style={styles.subtitle}>Choisis une série puis les Pokémon/cartes à privilégier pendant le scraping.</p>
          </div>
          <button type="button" aria-label="Fermer la sélection de cartes" onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.section}>
          <span style={styles.label}>Série sélectionnée</span>
          <div style={styles.lockedSeriesBox}>
            <strong>{seriesLabel}</strong>
            <span>{cards.length} cartes disponibles dans cette série.</span>
          </div>
        </div>

        <label style={styles.section}>
          <span style={styles.label}>Rechercher une carte</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex: Dracaufeu, Ronflex, Ectoplasma..."
            style={styles.searchInput}
            autoFocus
          />
        </label>

        <div style={styles.cardsHeader}>
          <strong>Cartes disponibles</strong>
          <span>{draftTargets.length} sélectionnée{draftTargets.length > 1 ? 's' : ''}</span>
        </div>

        <div className="target-card-grid" style={styles.cardsGrid}>
          {filteredCards.length > 0 ? filteredCards.map(target => {
            const selected = selectedIds.has(target.id);
            return (
              <button
                key={target.id}
                type="button"
                style={{ ...styles.cardButton, ...(selected ? styles.cardButtonSelected : {}) }}
                onClick={() => toggleTarget(target)}
              >
                <span style={styles.cardTopLine}>
                  <strong>{target.name}</strong>
                  {selected && <TcgIcon name="contacted" size={15} />}
                </span>
                <span style={styles.cardMeta}>{target.number} · {target.rarity}</span>
              </button>
            );
          }) : (
            <div style={styles.empty}>Aucune carte trouvée dans cette série.</div>
          )}
        </div>

        <div style={styles.hint}>Ces cibles orientent les requêtes, mais le radar continue de filtrer les annonces hors budget ou hors qualité.</div>

        <footer className="target-modal-actions" style={styles.footer}>
          <button type="button" style={styles.resetButton} onClick={() => setDraftTargets([])} disabled={draftTargets.length === 0}>Tout désélectionner</button>
          <div style={styles.footerRight}>
            <button type="button" style={styles.secondaryButton} onClick={onClose}>Annuler</button>
            <button type="button" style={styles.primaryButton} onClick={apply} disabled={sameSelection(selectedTargets, draftTargets)}>Valider la cible</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    background: 'rgba(2, 6, 23, 0.78)',
    backdropFilter: 'blur(6px)',
  },
  modal: {
    width: 'min(760px, calc(100vw - 32px))',
    maxHeight: 'calc(100vh - 32px)',
    overflow: 'auto',
    background: `linear-gradient(135deg, ${theme.colors.primary.deepDark}, ${theme.colors.primary.midnight})`,
    border: `1px solid ${theme.accents.hunterGold}40`,
    borderRadius: theme.borders.radiusLg,
    boxShadow: theme.shadows.xl,
    padding: theme.spacing.xl,
    color: theme.colors.text.primary,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  eyebrow: {
    color: theme.accents.manaCyan,
    fontSize: theme.typography.sizes.tiny,
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    fontWeight: theme.typography.weights.semibold,
  },
  title: {
    margin: `${theme.spacing.xs} 0`,
    fontSize: theme.typography.sizes.headingMd,
  },
  subtitle: {
    margin: 0,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.bodyMd,
    lineHeight: 1.45,
  },
  closeButton: {
    width: '34px',
    height: '34px',
    borderRadius: theme.borders.radiusMd,
    border: `1px solid ${theme.colors.primary.slate}`,
    background: 'rgba(10,14,39,.42)',
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    fontSize: '24px',
    lineHeight: 1,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  label: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: '.5px',
  },
  lockedSeriesBox: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    alignItems: 'center',
    padding: theme.spacing.md,
    border: `1px solid ${theme.accents.manaCyan}35`,
    borderRadius: theme.borders.radiusMd,
    background: `${theme.accents.manaCyan}0D`,
    color: theme.colors.text.secondary,
    flexWrap: 'wrap',
  },
  searchInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusMd,
    background: theme.colors.primary.midnight,
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.bodyMd,
  },
  cardsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    color: theme.colors.text.secondary,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  cardButton: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    textAlign: 'left',
    padding: theme.spacing.md,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusMd,
    background: 'rgba(10,14,39,.35)',
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    transition: theme.effects.transitionFast,
  },
  cardButtonSelected: {
    color: theme.accents.hunterGold,
    borderColor: `${theme.accents.hunterGold}99`,
    background: `${theme.accents.hunterGold}14`,
    boxShadow: '0 0 18px rgba(230,184,92,.12)',
  },
  cardTopLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  cardMeta: {
    color: theme.accents.manaCyan,
    fontSize: theme.typography.sizes.bodySm,
  },
  empty: {
    gridColumn: '1 / -1',
    color: theme.colors.text.tertiary,
    padding: theme.spacing.lg,
    border: `1px dashed ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusMd,
  },
  hint: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.sizes.bodySm,
    lineHeight: 1.45,
    marginBottom: theme.spacing.lg,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    borderTop: `1px solid ${theme.colors.primary.slate}`,
  },
  footerRight: {
    display: 'flex',
    gap: theme.spacing.md,
  },
  resetButton: {
    border: 'none',
    background: 'transparent',
    color: theme.accents.warningOrange,
    cursor: 'pointer',
    fontWeight: theme.typography.weights.semibold,
  },
  secondaryButton: {
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusMd,
    background: 'transparent',
    color: theme.colors.text.secondary,
    cursor: 'pointer',
  },
  primaryButton: {
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    border: 'none',
    borderRadius: theme.borders.radiusMd,
    background: theme.accents.hunterGold,
    color: theme.colors.primary.obsidian,
    cursor: 'pointer',
    fontWeight: theme.typography.weights.bold,
  },
};

const responsiveCss = `
  @media (max-width: 760px) {
    .target-modal {
      width: calc(100vw - 24px) !important;
      max-height: calc(100vh - 24px) !important;
      padding: ${theme.spacing.lg} !important;
    }
    .target-series-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .target-card-grid {
      grid-template-columns: 1fr !important;
    }
    .target-modal-actions {
      flex-direction: column !important;
    }
    .target-modal-actions > div,
    .target-modal-actions button {
      width: 100% !important;
    }
  }
`;
