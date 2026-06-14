import { updateListing } from '../services/api';
import theme from '../theme';

function LotDetail({ listing, onClose, onUpdate }) {
  const handleStatusChange = async (newStatus) => {
    try {
      await updateListing(listing.id, { status: newStatus });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        
        <div style={styles.header}>
          <h2 style={styles.title}>{listing.title}</h2>
          <span style={{
            ...styles.score,
            background: getScoreGradient(listing.score),
            boxShadow: getScoreShadow(listing.score),
          }}>
            {listing.score}
          </span>
        </div>

        {listing.image_url && (
          <img
            src={listing.image_url}
            alt={listing.title}
            style={styles.image}
          />
        )}
        {!listing.image_url && (
          <div style={styles.imagePlaceholder}>
            <span style={styles.imagePlaceholderIcon}>🎴</span>
          </div>
        )}

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Détails</h3>
          <div style={styles.details}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Prix:</span>
              <span style={styles.detailValue}>{listing.price}€</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Localisation:</span>
              <span style={styles.detailValue}>{listing.location} ({listing.distance_km}km)</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Source:</span>
              <span style={styles.detailValue}>{listing.source}</span>
            </div>
            {listing.card_count_estimate && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Cartes estimées:</span>
                <span style={styles.detailValue}>{listing.card_count_estimate}</span>
              </div>
            )}
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Posté:</span>
              <span style={styles.detailValue}>
                {listing.posted_at ? new Date(listing.posted_at).toLocaleDateString('fr-FR') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {listing.description && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Description</h3>
            <p style={styles.description}>{listing.description}</p>
          </div>
        )}

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Indicateurs</h3>
          <div style={styles.badges}>
            <span style={listing.is_wizards ? styles.badgeWizards : styles.badgeInactive}>
              {listing.is_wizards ? '⭐' : '✗'} Wizards
            </span>
            <span style={listing.is_french ? styles.badgeFrench : styles.badgeInactive}>
              {listing.is_french ? '🇫🇷' : '✗'} Français
            </span>
            <span style={listing.is_lot ? styles.badgeLot : styles.badgeInactive}>
              {listing.is_lot ? '📦' : '✗'} Lot
            </span>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Actions</h3>
          <div style={styles.actions}>
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.btnPrimary}
            >
              🔗 Voir l'annonce
            </a>
            <button
              style={styles.btnInterested}
              onClick={() => handleStatusChange('interested')}
            >
              ⭐ Marquer intéressant
            </button>
            <button
              style={styles.btnReviewed}
              onClick={() => handleStatusChange('reviewed')}
            >
              👁 Marquer vu
            </button>
            <button
              style={styles.btnPassed}
              onClick={() => handleStatusChange('passed')}
            >
              ✗ Passer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getScoreGradient(score) {
  if (score >= 80) return `linear-gradient(135deg, ${theme.colors.status.legendary}, ${theme.colors.accent.goldLight})`;
  if (score >= 60) return `linear-gradient(135deg, ${theme.colors.primary.arcanePurpleLight}, ${theme.colors.accent.manaPurple})`;
  return `linear-gradient(135deg, ${theme.colors.neutral.border}, ${theme.colors.neutral.borderLight})`;
}

function getScoreShadow(score) {
  if (score >= 80) return theme.shadows.glowRune;
  if (score >= 60) return theme.shadows.glowMagic;
  return theme.shadows.sm;
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(10, 14, 39, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: theme.spacing.xl,
  },
  modal: {
    background: theme.colors.neutral.bgCard,
    border: `${theme.borders.widthMedium} solid ${theme.colors.primary.arcanePurpleLight}`,
    borderRadius: theme.borders.radiusLg,
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    boxShadow: `${theme.shadows.xl}, ${theme.shadows.glowMagic}`,
  },
  closeBtn: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    width: '40px',
    height: '40px',
    background: theme.colors.neutral.bgHover,
    border: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
    borderRadius: theme.borders.radiusMd,
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.typography.sizes.headingMd,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${theme.effects.transitionNormal}`,
    fontFamily: theme.typography.fonts.primary,
    zIndex: 10,
  },
  header: {
    padding: theme.spacing.xl,
    borderBottom: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.lg,
    background: theme.colors.magic.voidEdge,
  },
  title: {
    fontSize: theme.typography.sizes.headingMd,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.neutral.textPrimary,
    margin: 0,
    flex: 1,
  },
  score: {
    color: theme.colors.neutral.textPrimary,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: '20px',
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.headingMd,
    minWidth: '60px',
    textAlign: 'center',
  },
  image: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '300px',
    background: `linear-gradient(135deg, ${theme.colors.magic.voidDark}, ${theme.colors.magic.voidEdge})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: '96px',
    filter: 'drop-shadow(0 0 16px rgba(124, 58, 237, 0.6))',
  },
  section: {
    padding: theme.spacing.xl,
    borderBottom: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.headingSm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.accent.enchantGold,
    marginBottom: theme.spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    background: theme.colors.neutral.bgHover,
    borderRadius: theme.borders.radiusMd,
  },
  detailLabel: {
    fontSize: theme.typography.sizes.bodyMd,
    color: theme.colors.neutral.textSecondary,
    fontWeight: theme.typography.weights.semibold,
  },
  detailValue: {
    fontSize: theme.typography.sizes.bodyMd,
    color: theme.colors.neutral.textPrimary,
    fontWeight: theme.typography.weights.semibold,
  },
  description: {
    fontSize: theme.typography.sizes.bodyMd,
    color: theme.colors.neutral.textSecondary,
    lineHeight: '1.6',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  badges: {
    display: 'flex',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  badgeWizards: {
    background: `linear-gradient(135deg, ${theme.colors.status.legendary}, ${theme.colors.accent.goldLight})`,
    color: theme.colors.magic.voidDark,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    boxShadow: theme.shadows.glowRune,
  },
  badgeFrench: {
    background: theme.colors.primary.arcanePurpleLight,
    color: theme.colors.neutral.textPrimary,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    boxShadow: theme.shadows.glowMagic,
  },
  badgeLot: {
    background: theme.colors.accent.manaBlue,
    color: theme.colors.magic.voidDark,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    boxShadow: theme.shadows.glowMana,
  },
  badgeInactive: {
    background: theme.colors.neutral.bgHover,
    color: theme.colors.neutral.textSecondary,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.normal,
    border: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: theme.spacing.md,
  },
  btnPrimary: {
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    background: theme.colors.accent.manaBlue,
    color: theme.colors.magic.voidDark,
    border: 'none',
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionNormal}`,
    textAlign: 'center',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: theme.shadows.glowMana,
  },
  btnInterested: {
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    background: `linear-gradient(135deg, ${theme.colors.status.legendary}, ${theme.colors.accent.goldLight})`,
    color: theme.colors.magic.voidDark,
    border: 'none',
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionNormal}`,
    boxShadow: theme.shadows.glowRune,
  },
  btnReviewed: {
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    background: theme.colors.primary.arcanePurpleLight,
    color: theme.colors.neutral.textPrimary,
    border: 'none',
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionNormal}`,
    boxShadow: theme.shadows.glowMagic,
  },
  btnPassed: {
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    background: theme.colors.neutral.bgHover,
    color: theme.colors.neutral.textSecondary,
    border: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionNormal}`,
  },
};

// Add hover styles via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  button:hover, a:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }
`;
document.head.appendChild(styleSheet);

export default LotDetail;
