import { useState } from 'react';
import LotDetailModal from './LotDetailModal';
import Badge from './Badge';
import TcgIcon from './TcgIcon';
import theme, { getRarityLevel, rarityLabels } from '../theme';

function LotList({ listings, onUpdate, highlightedIds = [] }) {
  const [selectedLot, setSelectedLot] = useState(null);

  if (listings.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}><TcgIcon name="radar" size={54} /></div>
        <div style={styles.emptyText}>Aucune opportunité détectée avec ces filtres.</div>
        <div style={styles.emptyHint}>Ajustez vos critères de chasse ou lancez un nouveau scraping</div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.grid}>
        {listings.map((listing) => {
          const rarity = getRarityLevel(listing.score);
          const rarityStyle = getRarityStyle(rarity);
          const isHighlighted = highlightedIds.includes(listing.id);

          return (
            <div
              key={listing.id}
              style={{
                ...styles.card,
                border: rarityStyle.border,
                boxShadow: isHighlighted ? `${rarityStyle.shadow}, 0 0 0 2px ${theme.accents.hunterGold}, 0 0 28px ${theme.accents.hunterGold}55` : rarityStyle.shadow,
                transform: isHighlighted ? 'translateY(-4px)' : 'none',
              }}
              onClick={() => setSelectedLot(listing)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = rarityStyle.hoverShadow;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = rarityStyle.shadow;
              }}
            >
              {isHighlighted && (
                <div style={styles.scanBadge}>
                  <TcgIcon name="spark" size={13} /> Dernier scan
                </div>
              )}

              {/* Image or placeholder */}
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={Array.isArray(listing.images) ? listing.images[0] : listing.images}
                  alt={listing.title}
                  style={styles.image}
                />
              ) : (
                <div style={styles.imagePlaceholder}>
                  <TcgIcon name="card" size={54} />
                </div>
              )}
              
              <div style={styles.content}>
                {/* Header: Score + Source */}
                <div style={styles.header}>
                  <span style={{
                    ...styles.score,
                    background: rarityStyle.scoreGradient,
                    boxShadow: rarityStyle.scoreGlow,
                    color: rarity === 'common' ? theme.colors.text.muted : theme.colors.text.primary,
                  }}>
                    {listing.score}
                  </span>
                  <span style={styles.source}>{listing.source}</span>
                </div>

                {/* Rarity Label */}
                <div style={{
                  ...styles.rarityLabel,
                  color: rarityStyle.color,
                }}>
                  {rarityLabels[rarity]}
                </div>
                
                {/* Title */}
                <h3 style={styles.title}>{listing.title}</h3>
                
                {/* Price + Value Estimate */}
                <div style={styles.priceSection}>
                  <div style={styles.priceRow}>
                    <span style={styles.priceLabel}>Prix:</span>
                    <span style={styles.price}>{listing.price}€</span>
                  </div>
                  {listing.value_estimate_low && listing.value_estimate_high && (
                    <div style={styles.estimateRow}>
                      <span style={styles.estimateLabel}>Valeur estimée:</span>
                      <span style={styles.estimate}>
                        {listing.value_estimate_low}€ - {listing.value_estimate_high}€
                      </span>
                    </div>
                  )}
                  {listing.gain_potential && listing.gain_potential > 0 && (
                    <div style={styles.gainRow}>
                      <span style={styles.gainLabel}>Gain potentiel:</span>
                      <span style={styles.gainValue}>
                        +{listing.gain_potential}€ ({listing.gain_percentage > 0 ? '+' : ''}{listing.gain_percentage}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Location + Distance */}
                {listing.location && (
                  <div style={styles.location}>
                    <TcgIcon name="pin" size={14} /> {listing.location}
                    {listing.distance_km !== null && (
                      <span style={styles.distance}> · {listing.distance_km} km</span>
                    )}
                  </div>
                )}
                
                {/* Opportunity Badges */}
                {listing.opportunity_signals && listing.opportunity_signals.length > 0 && (
                  <div style={styles.badgesSection}>
                    <div style={styles.badgesLabel}><TcgIcon name="spark" size={14} /> Opportunité:</div>
                    <div style={styles.badges}>
                      {listing.opportunity_signals.map((signal) => (
                        <Badge key={signal} signal={signal} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Badges */}
                {listing.risk_signals && listing.risk_signals.length > 0 && (
                  <div style={styles.badgesSection}>
                    <div style={styles.badgesLabel}><TcgIcon name="risk" size={14} /> Risques:</div>
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

                {/* Posted Time */}
                <div style={styles.timestamp}>
                  Publié {formatTimeAgo(listing.posted_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedLot && (
        <LotDetailModal
          isOpen={true}
          listing={selectedLot}
          onClose={() => setSelectedLot(null)}
        />
      )}
    </div>
  );
}

/**
 * Get rarity-specific styling (border, glow, gradient)
 */
function getRarityStyle(rarity) {
  const styles = {
    common: {
      color: theme.colors.status.common,
      border: `${theme.borders.widthThin} solid ${theme.colors.status.common}`,
      shadow: theme.shadows.sm,
      hoverShadow: theme.shadows.md,
      scoreGradient: `linear-gradient(135deg, ${theme.colors.status.common}, #3F4556)`,
      scoreGlow: 'none',
    },
    rare: {
      color: theme.colors.status.rare,
      border: `${theme.borders.widthMedium} solid ${theme.colors.status.rare}`,
      shadow: `${theme.shadows.md}, ${theme.shadows.glowRare}`,
      hoverShadow: `${theme.shadows.lg}, ${theme.shadows.glowRare}`,
      scoreGradient: `linear-gradient(135deg, ${theme.colors.status.rare}, #5B21B6)`,
      scoreGlow: theme.shadows.glowRare,
    },
    epic: {
      color: theme.colors.status.epic,
      border: `${theme.borders.widthMedium} solid ${theme.colors.status.epic}`,
      shadow: `${theme.shadows.md}, ${theme.shadows.glowEpic}`,
      hoverShadow: `${theme.shadows.lg}, ${theme.shadows.glowEpic}`,
      scoreGradient: `linear-gradient(135deg, ${theme.colors.status.epic}, #0369A1)`,
      scoreGlow: theme.shadows.glowEpic,
    },
    legendary: {
      color: theme.colors.status.legendary,
      border: `${theme.borders.widthThick} solid ${theme.colors.status.legendary}`,
      shadow: `${theme.shadows.lg}, ${theme.shadows.glowLegendary}`,
      hoverShadow: `${theme.shadows.xl}, ${theme.shadows.glowLegendary}`,
      scoreGradient: `linear-gradient(135deg, ${theme.colors.status.legendary}, #F59E0B)`,
      scoreGlow: theme.shadows.glowLegendary,
    },
    mythique: {
      color: theme.colors.status.mythique,
      border: `${theme.borders.widthThick} solid ${theme.colors.status.mythique}`,
      shadow: `${theme.shadows.xl}, ${theme.shadows.glowMythique}`,
      hoverShadow: `${theme.shadows.xl}, 0 0 40px rgba(255, 23, 68, 0.8)`,
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

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: theme.spacing.xl,
  },
  card: {
    position: 'relative',
    background: theme.colors.primary.deepDark,
    borderRadius: theme.borders.radiusLg,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionSmooth}`,
  },
  scanBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 2,
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.borders.radiusMd,
    background: `${theme.colors.primary.obsidian}E6`,
    border: `1px solid ${theme.accents.hunterGold}99`,
    color: theme.accents.hunterGold,
    fontSize: theme.typography.sizes.tiny,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: '.4px',
  },
  image: {
    width: '100%',
    height: '240px',
    objectFit: 'cover',
    borderBottom: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
  },
  imagePlaceholder: {
    width: '100%',
    height: '200px',
    background: `linear-gradient(135deg, ${theme.colors.primary.obsidian}, ${theme.colors.primary.midnight})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: '64px',
    filter: `drop-shadow(0 0 12px ${theme.accents.hunterGold}50)`,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  score: {
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: '24px',
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.sizes.bodyLg,
    minWidth: '56px',
    textAlign: 'center',
  },
  source: {
    background: theme.colors.primary.slate,
    color: theme.colors.text.tertiary,
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.medium,
    textTransform: 'uppercase',
  },
  rarityLabel: {
    fontSize: theme.typography.sizes.bodySm,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  title: {
    fontSize: theme.typography.sizes.bodyLg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: '44px',
  },
  priceSection: {
    background: theme.colors.primary.midnight,
    padding: theme.spacing.md,
    borderRadius: theme.borders.radiusMd,
    marginBottom: theme.spacing.md,
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  priceLabel: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.text.tertiary,
  },
  price: {
    fontSize: theme.typography.sizes.headingMd,
    fontWeight: theme.typography.weights.bold,
    color: theme.accents.hunterGold,
    textShadow: `0 0 12px ${theme.accents.hunterGold}80`,
  },
  estimateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  estimateLabel: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.text.tertiary,
  },
  estimate: {
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
  },
  gainRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: theme.spacing.xs,
    borderTop: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
  },
  gainLabel: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.text.tertiary,
  },
  gainValue: {
    fontSize: theme.typography.sizes.bodyLg,
    fontWeight: theme.typography.weights.bold,
    color: theme.accents.successGreen,
  },
  location: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.bodySm,
    marginBottom: theme.spacing.md,
  },
  distance: {
    color: theme.accents.manaCyan,
    fontWeight: theme.typography.weights.medium,
  },
  badgesSection: {
    marginBottom: theme.spacing.md,
  },
  badgesLabel: {
    fontSize: theme.typography.sizes.tiny,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: theme.spacing.xs,
  },
  badges: {
    display: 'flex',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  timestamp: {
    fontSize: theme.typography.sizes.tiny,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTop: `${theme.borders.widthThin} solid ${theme.colors.primary.slate}`,
  },
  empty: {
    textAlign: 'center',
    padding: theme.spacing.xxxl,
    background: theme.colors.primary.deepDark,
    border: `${theme.borders.widthMedium} solid ${theme.colors.primary.slate}`,
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
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyHint: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.text.secondary,
  },
};

export default LotList;
