import { updateListing } from '../services/api';
import theme, { getRarityLevel, rarityLabels } from '../theme';
import Badge from './Badge';
import TcgIcon from './TcgIcon';

function LotDetail({ listing, onClose, onUpdate }) {
  const rarity = getRarityLevel(listing.score);
  const rarityStyle = getRarityStyle(rarity);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateListing(listing.id, { status: newStatus });
      onUpdate(listing.id, { status: newStatus });
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleOpenListing = () => {
    window.open(listing.url, '_blank');
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={{
          ...styles.modal,
          border: rarityStyle.border,
          boxShadow: rarityStyle.shadow,
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        
        {/* Header: Rarity + Score */}
        <div style={styles.header}>
          <div style={{
            ...styles.rarityLabel,
            color: rarityStyle.color,
          }}>
            {rarityLabels[rarity]}
          </div>
          <span style={{
            ...styles.score,
            background: rarityStyle.scoreGradient,
            boxShadow: rarityStyle.scoreGlow,
          }}>
            {listing.score}
          </span>
        </div>

        {/* Title */}
        <h2 style={styles.title}>{listing.title}</h2>

        {/* Image */}
        {listing.images && listing.images.length > 0 ? (
          <img
            src={listing.images.split(',')[0]}
            alt={listing.title}
            style={styles.image}
          />
        ) : (
          <div style={styles.imagePlaceholder}>
            <TcgIcon name="card" size={54} />
          </div>
        )}

        {/* Price + Value Estimation */}
        <div style={styles.priceSection}>
          <div style={styles.priceRow}>
            <span style={styles.priceLabel}>Prix demandé:</span>
            <span style={styles.price}>{listing.price}€</span>
          </div>
          {listing.value_estimate_low && listing.value_estimate_high && (
            <>
              <div style={styles.estimateRow}>
                <span style={styles.estimateLabel}>Valeur estimée:</span>
                <span style={styles.estimate}>
                  {listing.value_estimate_low}€ - {listing.value_estimate_high}€
                </span>
              </div>
              {listing.confidence && (
                <div style={styles.confidenceRow}>
                  <span style={styles.confidenceLabel}>Confiance:</span>
                  <span style={styles.confidence}>{listing.confidence}</span>
                </div>
              )}
              {listing.gain_potential !== undefined && (
                <div style={styles.gainRow}>
                  <span style={styles.gainLabel}>Gain potentiel:</span>
                  <span style={{
                    ...styles.gainValue,
                    color: listing.gain_potential > 0 
                      ? theme.accents.successGreen 
                      : theme.accents.preyRed,
                  }}>
                    {listing.gain_potential > 0 ? '+' : ''}{listing.gain_potential}€ 
                    ({listing.gain_percentage > 0 ? '+' : ''}{listing.gain_percentage}%)
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Location */}
        {listing.location && (
          <div style={styles.locationSection}>
            <TcgIcon name="pin" size={14} />
            <span style={styles.location}>{listing.location}</span>
            {listing.distance_km !== null && (
              <span style={styles.distance}> · {listing.distance_km} km</span>
            )}
          </div>
        )}

        {/* Opportunity Signals */}
        {listing.opportunity_signals && listing.opportunity_signals.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}><TcgIcon name="spark" size={18} /> Pourquoi c'est intéressant</h3>
            <div style={styles.badges}>
              {listing.opportunity_signals.map((signal) => (
                <Badge key={signal} signal={signal} />
              ))}
            </div>
          </div>
        )}

        {/* Risk Signals */}
        {listing.risk_signals && listing.risk_signals.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}><TcgIcon name="risk" size={18} /> Points d'attention</h3>
            <div style={styles.badges}>
              {listing.risk_signals.map((signal) => (
                <Badge 
                  key={signal} 
                  customText={formatRiskSignal(signal)}
                  icon="risk"
                />
              ))}
            </div>
          </div>
        )}

        {/* Explanation (markdown) */}
        {listing.explanation && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}><TcgIcon name="chart" size={18} /> Analyse détaillée</h3>
            <div style={styles.explanation}>
              {listing.explanation}
            </div>
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Description du vendeur</h3>
            <p style={styles.description}>{listing.description}</p>
          </div>
        )}

        {/* Metadata */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Informations</h3>
          <div style={styles.metadata}>
            <div style={styles.metadataRow}>
              <span style={styles.metadataLabel}>Source:</span>
              <span style={styles.metadataValue}>{listing.source}</span>
            </div>
            {listing.card_count_estimate && (
              <div style={styles.metadataRow}>
                <span style={styles.metadataLabel}>Cartes estimées:</span>
                <span style={styles.metadataValue}>{listing.card_count_estimate}</span>
              </div>
            )}
            <div style={styles.metadataRow}>
              <span style={styles.metadataLabel}>Publié:</span>
              <span style={styles.metadataValue}>
                {formatTimeAgo(listing.posted_at)}
              </span>
            </div>
            <div style={styles.metadataRow}>
              <span style={styles.metadataLabel}>Statut:</span>
              <span style={styles.metadataValue}>{formatStatus(listing.status)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          <button 
            style={styles.primaryButton}
            onClick={handleOpenListing}
          >
            <TcgIcon name="link" size={16} /> Voir l'annonce
          </button>
          <button 
            style={styles.successButton}
            onClick={() => handleStatusChange('interested')}
          >
            <TcgIcon name="watch" size={16} /> Watchlist
          </button>
          <button 
            style={styles.dangerButton}
            onClick={() => handleStatusChange('passed')}
          >
            <TcgIcon name="ignore" size={16} /> Ignorer
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Get rarity-specific styling
 */
function getRarityStyle(rarity) {
  const styles = {
    common: {
      color: theme.colors.status.common,
      border: `${theme.borders.widthThin} solid ${theme.colors.status.common}`,
      shadow: theme.shadows.sm,
      scoreGradient: `linear-gradient(135deg, ${theme.colors.status.common}, #3F4556)`,
      scoreGlow: 'none',
    },
    rare: {
      color: theme.colors.status.rare,
      border: `${theme.borders.widthMedium} solid ${theme.colors.status.rare}`,
      shadow: `${theme.shadows.md}, ${theme.shadows.glowRare}`,
      scoreGradient: `linear-gradient(135deg, ${theme.colors.status.rare}, #5B21B6)`,
      scoreGlow: theme.shadows.glowRare,
    },
    epic: {
      color: theme.colors.status.epic,
      border: `${theme.borders.widthMedium} solid ${theme.colors.status.epic}`,
      shadow: `${theme.shadows.md}, ${theme.shadows.glowEpic}`,
      scoreGradient: `linear-gradient(135deg, ${theme.colors.status.epic}, #0369A1)`,
      scoreGlow: theme.shadows.glowEpic,
    },
    legendary: {
      color: theme.colors.status.legendary,
      border: `${theme.borders.widthThick} solid ${theme.colors.status.legendary}`,
      shadow: `${theme.shadows.lg}, ${theme.shadows.glowLegendary}`,
      scoreGradient: `linear-gradient(135deg, ${theme.colors.status.legendary}, #F59E0B)`,
      scoreGlow: theme.shadows.glowLegendary,
    },
    mythique: {
      color: theme.colors.status.mythique,
      border: `${theme.borders.widthThick} solid ${theme.colors.status.mythique}`,
      shadow: `${theme.shadows.xl}, ${theme.shadows.glowMythique}`,
      scoreGradient: `linear-gradient(135deg, ${theme.colors.status.mythique}, #D32F2F)`,
      scoreGlow: theme.shadows.glowMythique,
    },
  };
  return styles[rarity] || styles.common;
}

/**
 * Format risk signal to display label
 */
function formatRiskSignal(signal) {
  const labels = {
    condition_unclear: 'État non précisé',
    incomplete_photos: 'Peu de photos',
    old_listing: 'Annonce ancienne',
    high_price: 'Prix élevé',
    far_location: 'Loin',
  };
  return labels[signal] || signal.replace(/_/g, ' ');
}

/**
 * Format time ago from ISO date string
 */
function formatTimeAgo(isoDate) {
  const now = new Date();
  const posted = new Date(isoDate);
  const diffMs = now - posted;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'à l\'instant';
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return 'hier';
  return `il y a ${diffDays} jours`;
}

/**
 * Format status label
 */
function formatStatus(status) {
  const labels = {
    new: 'Nouveau',
    interested: 'Watchlist',
    reviewed: 'Vu',
    ignored: 'Ignoré',
    contacted: 'Contacté',
    purchased: 'Acheté',
    passed: 'Ignoré',
  };
  return labels[status] || status;
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: theme.spacing.xl,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: theme.colors.primary.deepDark,
    borderRadius: theme.borders.radiusLg,
    maxWidth: '800px',
    maxHeight: '90vh',
    width: '100%',
    overflow: 'auto',
    position: 'relative',
    padding: theme.spacing.xxl,
  },
  closeBtn: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    background: theme.colors.primary.slate,
    color: theme.colors.text.primary,
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${theme.effects.transitionNormal}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  rarityLabel: {
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  score: {
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: '24px',
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.headingMd,
    minWidth: '64px',
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  title: {
    fontSize: theme.typography.sizes.headingLg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xl,
    lineHeight: '1.3',
  },
  image: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'cover',
    borderRadius: theme.borders.radiusMd,
    marginBottom: theme.spacing.xl,
  },
  imagePlaceholder: {
    width: '100%',
    height: '300px',
    background: `linear-gradient(135deg, ${theme.colors.primary.obsidian}, ${theme.colors.primary.midnight})`,
    borderRadius: theme.borders.radiusMd,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  imagePlaceholderIcon: {
    fontSize: '80px',
    filter: `drop-shadow(0 0 16px ${theme.accents.hunterGold}50)`,
  },
  priceSection: {
    background: theme.colors.primary.midnight,
    padding: theme.spacing.lg,
    borderRadius: theme.borders.radiusMd,
    marginBottom: theme.spacing.xl,
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottom: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
  },
  priceLabel: {
    fontSize: theme.typography.sizes.bodyMd,
    color: theme.colors.text.tertiary,
  },
  price: {
    fontSize: theme.typography.sizes.headingLg,
    fontWeight: theme.typography.weights.bold,
    color: theme.accents.hunterGold,
    textShadow: `0 0 16px ${theme.accents.hunterGold}80`,
  },
  estimateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  estimateLabel: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.text.tertiary,
  },
  estimate: {
    fontSize: theme.typography.sizes.bodyLg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  confidenceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  confidenceLabel: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.text.tertiary,
  },
  confidence: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  gainRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTop: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
  },
  gainLabel: {
    fontSize: theme.typography.sizes.bodyMd,
    color: theme.colors.text.tertiary,
  },
  gainValue: {
    fontSize: theme.typography.sizes.headingMd,
    fontWeight: theme.typography.weights.bold,
  },
  locationSection: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
    background: theme.colors.primary.midnight,
    borderRadius: theme.borders.radiusMd,
  },
  locationIcon: {
    fontSize: '20px',
  },
  location: {
    fontSize: theme.typography.sizes.bodyMd,
    color: theme.colors.text.secondary,
  },
  distance: {
    fontSize: theme.typography.sizes.bodyMd,
    color: theme.accents.manaCyan,
    fontWeight: theme.typography.weights.medium,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.headingSm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  badges: {
    display: 'flex',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  explanation: {
    fontSize: theme.typography.sizes.bodyMd,
    color: theme.colors.text.secondary,
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  description: {
    fontSize: theme.typography.sizes.bodyMd,
    color: theme.colors.text.secondary,
    lineHeight: '1.6',
  },
  metadata: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  metadataRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    background: theme.colors.primary.midnight,
    borderRadius: theme.borders.radiusSm,
  },
  metadataLabel: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.text.tertiary,
  },
  metadataValue: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  primaryButton: {
    padding: theme.spacing.lg,
    background: theme.accents.manaCyan,
    color: theme.colors.primary.obsidian,
    border: 'none',
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fonts.primary,
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionNormal}`,
  },
  successButton: {
    padding: theme.spacing.lg,
    background: theme.accents.successGreen,
    color: theme.colors.primary.obsidian,
    border: 'none',
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fonts.primary,
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionNormal}`,
  },
  dangerButton: {
    padding: theme.spacing.lg,
    background: theme.colors.primary.slate,
    color: theme.colors.text.secondary,
    border: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fonts.primary,
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionNormal}`,
  },
};

// Add hover styles via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  }
`;
document.head.appendChild(styleSheet);

export default LotDetail;
