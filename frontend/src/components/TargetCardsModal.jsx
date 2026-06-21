import { useEffect, useMemo, useState } from 'react';
import theme from '../theme';
import TcgIcon from './TcgIcon';

export const TARGET_SERIES_OPTIONS = [
  { value: 'base', label: 'Set de Base' },
  { value: 'jungle', label: 'Jungle' },
  { value: 'fossil', label: 'Fossile' },
  { value: 'rocket', label: 'Team Rocket' },
];

export const SERIES_CARD_TARGETS = {
  base: [
    card('base-charizard', 'Dracaufeu', '4/102', ['dracaufeu', 'charizard base set', 'dracaufeu set de base']),
    card('base-blastoise', 'Tortank', '2/102', ['tortank', 'blastoise base set', 'tortank set de base']),
    card('base-venusaur', 'Florizarre', '15/102', ['florizarre', 'venusaur base set', 'florizarre set de base']),
    card('base-raichu', 'Raichu', '14/102', ['raichu', 'raichu set de base']),
    card('base-gyarados', 'Léviator', '6/102', ['léviator', 'leviator', 'gyarados base set']),
    card('base-mewtwo', 'Mewtwo', '10/102', ['mewtwo', 'mewtwo set de base']),
    card('base-alakazam', 'Alakazam', '1/102', ['alakazam', 'alakazam set de base']),
    card('base-chansey', 'Leveinard', '3/102', ['leveinard', 'chansey base set']),
    card('base-machamp', 'Mackogneur', '8/102', ['mackogneur', 'machamp base set']),
    card('base-zapdos', 'Électhor', '16/102', ['électhor', 'electhor', 'zapdos base set']),
  ],
  jungle: [
    card('jungle-snorlax', 'Ronflex', '11/64', ['ronflex jungle', 'snorlax jungle']),
    card('jungle-vaporeon', 'Aquali', '12/64', ['aquali jungle', 'vaporeon jungle']),
    card('jungle-jolteon', 'Voltali', '4/64', ['voltali jungle', 'jolteon jungle']),
    card('jungle-flareon', 'Pyroli', '3/64', ['pyroli jungle', 'flareon jungle']),
    card('jungle-nidoqueen', 'Nidoqueen', '7/64', ['nidoqueen jungle']),
    card('jungle-pinsir', 'Scarabrute', '9/64', ['scarabrute jungle', 'pinsir jungle']),
    card('jungle-scyther', 'Insécateur', '10/64', ['insécateur jungle', 'insecateur jungle', 'scyther jungle']),
    card('jungle-kangaskhan', 'Kangourex', '5/64', ['kangourex jungle', 'kangaskhan jungle']),
    card('jungle-clefable', 'Mélodelfe', '1/64', ['mélodelfe jungle', 'melodelfe jungle', 'clefable jungle']),
    card('jungle-wigglytuff', 'Grodoudou', '16/64', ['grodoudou jungle', 'wigglytuff jungle']),
  ],
  fossil: [
    card('fossil-dragonite', 'Dracolosse', '4/62', ['dracolosse fossile', 'dragonite fossil']),
    card('fossil-articuno', 'Artikodin', '2/62', ['artikodin fossile', 'articuno fossil']),
    card('fossil-zapdos', 'Électhor', '15/62', ['électhor fossile', 'electhor fossile', 'zapdos fossil']),
    card('fossil-moltres', 'Sulfura', '12/62', ['sulfura fossile', 'moltres fossil']),
    card('fossil-gengar', 'Ectoplasma', '5/62', ['ectoplasma fossile', 'gengar fossil']),
    card('fossil-lapras', 'Lokhlass', '10/62', ['lokhlass fossile', 'lapras fossil']),
    card('fossil-hypno', 'Hypnomade', '8/62', ['hypnomade fossile', 'hypno fossil']),
    card('fossil-aerodactyl', 'Ptéra', '1/62', ['ptéra fossile', 'ptera fossile', 'aerodactyl fossil']),
    card('fossil-magneton', 'Magnéton', '11/62', ['magnéton fossile', 'magneton fossile']),
    card('fossil-kabutops', 'Kabutops', '9/62', ['kabutops fossile', 'kabutops fossil']),
  ],
  rocket: [
    card('rocket-dark-charizard', 'Dracaufeu Obscur', '4/82', ['dracaufeu obscur', 'dracaufeu sombre', 'dark charizard']),
    card('rocket-dark-blastoise', 'Tortank Obscur', '3/82', ['tortank obscur', 'tortank sombre', 'dark blastoise']),
    card('rocket-dark-raichu', 'Raichu Obscur', '83/82', ['raichu obscur', 'raichu sombre', 'dark raichu']),
    card('rocket-dark-dragonite', 'Dracolosse Obscur', '5/82', ['dracolosse obscur', 'dracolosse sombre', 'dark dragonite']),
    card('rocket-dark-machamp', 'Mackogneur Obscur', '10/82', ['mackogneur obscur', 'dark machamp']),
    card('rocket-dark-alakazam', 'Alakazam Obscur', '1/82', ['alakazam obscur', 'dark alakazam']),
    card('rocket-dark-golbat', 'Nosferalto Obscur', '7/82', ['nosferalto obscur', 'dark golbat']),
    card('rocket-dark-hypno', 'Hypnomade Obscur', '9/82', ['hypnomade obscur', 'dark hypno']),
    card('rocket-dark-magneton', 'Magnéton Obscur', '11/82', ['magnéton obscur', 'magneton obscur', 'dark magneton']),
    card('rocket-dark-vileplume', 'Rafflesia Obscur', '13/82', ['rafflesia obscur', 'rafflésia obscur', 'dark vileplume']),
  ],
};

function card(id, name, number, queryTerms) {
  return { id, name, number, rarity: 'Holo', queryTerms, aliases: queryTerms };
}

function sameSelection(a = [], b = []) {
  return a.map(item => item.id).sort().join('|') === b.map(item => item.id).sort().join('|');
}

export default function TargetCardsModal({ isOpen, selectedSeries, selectedTargets = [], onClose, onApply }) {
  const initialSeries = selectedSeries === 'all' ? 'rocket' : selectedSeries;
  const [draftSeries, setDraftSeries] = useState(initialSeries);
  const [draftTargets, setDraftTargets] = useState(selectedTargets);
  const [search, setSearch] = useState('');
  const [seriesChanged, setSeriesChanged] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDraftSeries(selectedSeries === 'all' ? 'rocket' : selectedSeries);
    setDraftTargets(selectedTargets);
    setSearch('');
    setSeriesChanged(false);
  }, [isOpen, selectedSeries, selectedTargets]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const cards = SERIES_CARD_TARGETS[draftSeries] || [];
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
    onApply?.({ series: draftSeries, targets: draftTargets });
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
          <span style={styles.label}>Série</span>
          <div className="target-series-grid" style={styles.seriesGrid}>
            {TARGET_SERIES_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                style={{ ...styles.seriesButton, ...(draftSeries === option.value ? styles.seriesButtonActive : {}) }}
                onClick={() => {
                  if (option.value === draftSeries) return;
                  setDraftSeries(option.value);
                  setDraftTargets([]);
                  setSeriesChanged(true);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          {seriesChanged && <span style={styles.notice}>La sélection précédente a été réinitialisée car la série a changé.</span>}
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
            <button type="button" style={styles.primaryButton} onClick={apply} disabled={sameSelection(selectedTargets, draftTargets) && selectedSeries === draftSeries}>Valider la cible</button>
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
  seriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: theme.spacing.sm,
  },
  seriesButton: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: `1px solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusMd,
    background: 'rgba(10,14,39,.35)',
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    fontWeight: theme.typography.weights.semibold,
  },
  seriesButtonActive: {
    color: theme.accents.hunterGold,
    borderColor: `${theme.accents.hunterGold}99`,
    background: `${theme.accents.hunterGold}14`,
    boxShadow: `0 0 18px ${theme.accents.hunterGold}18`,
  },
  notice: {
    color: theme.accents.warningOrange,
    fontSize: theme.typography.sizes.bodySm,
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
