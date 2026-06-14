import { useState } from 'react';
import LotDetail from './LotDetail';
import theme from '../theme';

function LotList({ listings, onUpdate }) {
  const [selectedLot, setSelectedLot] = useState(null);

  if (listings.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>🔍</div>
        <div style={styles.emptyText}>Aucune annonce trouvée avec ces filtres.</div>
        <div style={styles.emptyHint}>Essayez d'ajuster vos critères de recherche</div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.grid}>
        {listings.map((listing) => (
          <div
            key={listing.id}
            style={{
              ...styles.card,
              ...(listing.status === 'new' && styles.cardNew),
              ...(listing.status === 'interested' && styles.cardInterested),
            }}
            onClick={() => setSelectedLot(listing)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = theme.shadows.glowMagic;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = theme.shadows.md;
            }}
          >
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
            
            <div style={styles.content}>
              <div style={styles.header}>
                <span style={{
                  ...styles.score,
                  background: getScoreGradient(listing.score),
                  boxShadow: getScoreShadow(listing.score),
                }}>
                  {listing.score}
                </span>
                <span style={styles.source}>{listing.source}</span>
              </div>
              
              <h3 style={styles.title}>{listing.title}</h3>
              
              <div style={styles.meta}>
                <span style={styles.price}>{listing.price}€</span>
                <span style={styles.location}>
                  📍 {listing.location} <span style={styles.distance}>({listing.distance_km}km)</span>
                </span>
              </div>
              
              <div style={styles.badges}>
                {listing.is_wizards === 1 && (
                  <span style={styles.badgeWizards}>⭐ Wizards</span>
                )}
                {listing.is_french === 1 && (
                  <span style={styles.badgeFrench}>🇫🇷 Français</span>
                )}
                {listing.is_lot === 1 && (
                  <span style={styles.badgeLot}>📦 Lot</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedLot && (
        <LotDetail
          listing={selectedLot}
          onClose={() => setSelectedLot(null)}
          onUpdate={onUpdate}
        />
      )}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: theme.spacing.xxl,
  },
  card: {
    background: theme.colors.neutral.bgCard,
    border: `${theme.borders.widthMedium} solid ${theme.colors.neutral.border}`,
    borderRadius: theme.borders.radiusLg,
    overflow: 'hidden',
    boxShadow: theme.shadows.md,
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionMagic}`,
  },
  cardNew: {
    borderLeft: `4px solid ${theme.colors.status.success}`,
  },
  cardInterested: {
    borderLeft: `4px solid ${theme.colors.accent.manaBlue}`,
  },
  image: {
    width: '100%',
    height: '240px',
    objectFit: 'cover',
    borderBottom: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
  },
  imagePlaceholder: {
    width: '100%',
    height: '200px',
    background: `linear-gradient(135deg, ${theme.colors.magic.voidDark}, ${theme.colors.magic.voidEdge})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: '64px',
    filter: 'drop-shadow(0 0 12px rgba(124, 58, 237, 0.6))',
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  score: {
    color: theme.colors.neutral.textPrimary,
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: '20px',
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.bodyLg,
    minWidth: '50px',
    textAlign: 'center',
  },
  source: {
    background: theme.colors.neutral.bgHover,
    color: theme.colors.neutral.textSecondary,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
    textTransform: 'uppercase',
    border: `${theme.borders.widthThin} solid ${theme.colors.neutral.border}`,
  },
  title: {
    fontSize: theme.typography.sizes.bodyLg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.md,
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: '44px',
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  price: {
    fontSize: theme.typography.sizes.headingMd,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.accent.enchantGold,
    textShadow: `0 0 12px rgba(255, 215, 0, 0.7)`,
  },
  location: {
    color: theme.colors.neutral.textSecondary,
    fontSize: theme.typography.sizes.bodySm,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  distance: {
    color: theme.colors.accent.manaBlue,
    fontWeight: theme.typography.weights.semibold,
  },
  badges: {
    display: 'flex',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  badgeWizards: {
    background: `linear-gradient(135deg, ${theme.colors.status.legendary}, ${theme.colors.accent.goldLight})`,
    color: theme.colors.magic.voidDark,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
    boxShadow: theme.shadows.glowRune,
  },
  badgeFrench: {
    background: theme.colors.primary.arcanePurpleLight,
    color: theme.colors.neutral.textPrimary,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
    boxShadow: theme.shadows.glowMagic,
  },
  badgeLot: {
    background: theme.colors.accent.manaBlue,
    color: theme.colors.magic.voidDark,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
    boxShadow: theme.shadows.glowMana,
  },
  empty: {
    textAlign: 'center',
    padding: theme.spacing.xxxl,
    background: theme.colors.neutral.bgCard,
    border: `${theme.borders.widthMedium} solid ${theme.colors.neutral.border}`,
    borderRadius: theme.borders.radiusLg,
    boxShadow: theme.shadows.md,
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: theme.spacing.lg,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: theme.typography.sizes.bodyLg,
    color: theme.colors.neutral.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptyHint: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.neutral.textSecondary,
  },
};

export default LotList;
