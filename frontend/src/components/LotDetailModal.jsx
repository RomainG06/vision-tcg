import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import theme from '../theme';
import Badge from './Badge';
import TcgIcon from './TcgIcon';

const QUALITY_TIER_LABELS = {
  strong_opportunity: '🔥 Opportunité forte',
  good_candidate: '🟢 Candidat intéressant',
  manual_review: '🟡 À vérifier',
  rejected_noise: '⛔ Bruit',
  rejected_budget: '💸 Hors budget',
  rejected_no_signal: 'Signal faible',
  rejected_low_score: 'Score faible',
};

const ACTION_LABELS = {
  contacter_rapidement: 'Contacter rapidement',
  examiner: 'Examiner',
  verifier_manuellement: 'Vérifier manuellement',
  ignorer: 'Ignorer',
};

/**
 * Modal full-screen pour afficher les détails complets d'une opportunité
 * Basé sur MODAL_DETAIL_SPEC.md (1167 lignes)
 */
function LotDetailModal({ isOpen, onClose, listing, onUpdate, onDelete }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalRef = useRef(null);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'ArrowLeft') {
        previousImage();
      }
      if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus modal
    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !listing) return null;

  const imageFallback = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#121633"/>
      <rect x="150" y="115" width="100" height="140" rx="14" fill="none" stroke="#E6B85C" stroke-width="8"/>
      <circle cx="200" cy="190" r="22" fill="none" stroke="#00D9FF" stroke-width="7"/>
      <text x="200" y="292" text-anchor="middle" fill="#9CA3AF" font-family="Arial" font-size="22">Image indisponible</text>
    </svg>`
  )}`;

  // Carousel navigation - handle both array and string formats
  let images;
  if (Array.isArray(listing.images)) {
    images = listing.images.length > 0 ? listing.images : [listing.image_url || imageFallback];
  } else if (typeof listing.images === 'string' && listing.images) {
    images = listing.images.split(',').map(url => url.trim()).filter(Boolean);
  } else {
    images = [listing.image_url || imageFallback];
  }
  if (images.length === 0) images = [imageFallback];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Actions
  const handleViewListing = () => {
    window.open(listing.url, '_blank');
  };

  const handleAddToWatchlist = async () => {
    try {
      await onUpdate?.(listing.id, { status: 'interested' });
      alert('Ajouté à la watchlist');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleIgnore = async () => {
    try {
      await onUpdate?.(listing.id, { status: 'ignored' });
      onClose();
      alert('Annonce ignorée');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleMarkContacted = async () => {
    try {
      await onUpdate?.(listing.id, { status: 'contacted' });
      onClose();
      alert('Marqué comme contacté');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      if (!window.confirm('Supprimer définitivement cette annonce de la liste ?')) return;
      await onDelete?.(listing.id);
      alert('Annonce supprimée');
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  };

  // Backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const price = Number(listing.price) || 0;
  const estimatedLow = listing.estimated_value_low ?? listing.estimated_value_min ?? null;
  const estimatedHigh = listing.estimated_value_high ?? listing.estimated_value_max ?? null;
  const distance = listing.distance ?? listing.distance_km ?? null;
  const platform = listing.source ?? listing.platform ?? '—';
  const confidence = listing.confidence ?? 70;
  const opportunitySignals = (listing.opportunity_signals || [])
    .filter((signal) => shouldDisplayOpportunitySignal(listing, signal));
  const qualityTier = listing.quality_tier || listing.quality?.quality_tier;
  const actionSuggestion = listing.action_suggestion || listing.quality?.action_suggestion;
  const positiveReasons = listing.positive_reasons || listing.quality?.positive_reasons || [];
  const riskReasons = listing.risk_reasons || listing.quality?.risk_reasons || [];

  // Calculate potential gain only when estimation exists
  const potentialMin = estimatedLow !== null ? estimatedLow - price : null;
  const potentialMax = estimatedHigh !== null ? estimatedHigh - price : null;

  // Risk level (based on confidence or signals)
  const riskLevel = confidence > 70 ? 'low' : confidence > 50 ? 'medium' : 'high';
  const riskDots = riskLevel === 'low' ? 1 : riskLevel === 'medium' ? 2 : 3;

  return (
    <div className="lot-modal-overlay" style={overlayStyle} onClick={handleBackdropClick}>
      <style>{responsiveCss}</style>
      <div
        ref={modalRef}
        className="lot-modal"
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        {/* HEADER */}
        <div className="lot-modal-header" style={headerStyle}>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Fermer">
            ✕
          </button>
          <h2 id="modal-title" className="lot-modal-title" style={titleStyle}>
            <TcgIcon name="radar" size={22} /> OPPORTUNITÉ DÉTECTÉE
          </h2>
          <div className="lot-modal-score" style={scoreBadgeStyle}>
            Score: {listing.score}
          </div>
        </div>

        {/* BODY SCROLLABLE */}
        <div className="lot-modal-body" style={bodyStyle}>
          {/* SECTION: Image + Prix */}
          <div className="lot-modal-media-grid" style={mediaGridStyle}>
            {/* Image Carousel */}
            <div style={carouselContainerStyle}>
              <div className="lot-modal-carousel" style={carouselMainImageStyle}>
                <img
                  src={images[currentImageIndex]}
                  alt={listing.title}
                  style={mainImageStyle}
                  onError={(e) => {
                    // Prevent infinite retry loop if remote image fails.
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = imageFallback;
                  }}
                />
                {images.length > 1 && (
                  <>
                    <button onClick={previousImage} style={carouselButtonLeftStyle} aria-label="Image précédente">
                      ◀
                    </button>
                    <button onClick={nextImage} style={carouselButtonRightStyle} aria-label="Image suivante">
                      ▶
                    </button>
                    <div style={carouselIndicatorStyle}>
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div style={thumbnailsContainerStyle}>
                  {images.slice(0, 4).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{
                        ...thumbnailStyle,
                        opacity: idx === currentImageIndex ? 1 : 0.5,
                        borderColor: idx === currentImageIndex ? theme.accents.manaCyan : theme.colors.primary.slate,
                      }}
                      onClick={() => setCurrentImageIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Prix + Estimation Block */}
            <div style={priceBlockContainerStyle}>
              <h3 className="lot-modal-listing-title" style={listingTitleStyle}>{listing.title}</h3>

              <div className="lot-modal-price-row" style={priceRowStyle}>
                <div>
                  <div style={labelSmallStyle}>Prix annoncé</div>
                  <div className="lot-modal-price" style={priceValueStyle}>{price} €</div>
                </div>
                <div>
                  <div style={labelSmallStyle}>Estimation</div>
                  <div style={estimationValueStyle}>
                    {estimatedLow ?? '?'}–{estimatedHigh ?? '?'} €
                  </div>
                </div>
              </div>

              <div style={potentialBlockStyle}>
                <div style={labelSmallStyle}>Potentiel de gain</div>
                <div style={potentialValueStyle(potentialMin, potentialMax)}>
                  {potentialMin === null ? 'Estimation indisponible' : `${potentialMin > 0 ? '+' : ''}${potentialMin} à ${potentialMax > 0 ? '+' : ''}${potentialMax} €`}
                </div>
              </div>

              {/* Badges */}
              <div style={badgesContainerStyle}>
                {opportunitySignals.slice(0, 6).map((signal, idx) => (
                  <Badge key={idx} signal={signal} />
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: Détails Annonce */}
          <div style={sectionContainerStyle}>
            <h4 style={sectionTitleStyle}><TcgIcon name="pin" size={18} /> DÉTAILS ANNONCE</h4>
            <div style={detailsGridStyle}>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Plateforme:</span>
                <span style={detailValueStyle}>{platform}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Publié:</span>
                <span style={detailValueStyle}>{listing.published_at || 'Récemment'}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Localisation:</span>
                <span style={distanceStyle(distance)}>
                  {listing.location || '—'}{distance !== null ? ` • ${distance} km de vous` : ''}
                </span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>État:</span>
                <span style={detailValueStyle}>{listing.condition || 'Non précisé'}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Vendeur:</span>
                <span style={detailValueStyle}>{listing.seller_type || 'Particulier'}</span>
              </div>
            </div>
          </div>

          {/* SECTION: Pourquoi c'est intéressant (Markdown) */}
          {listing.explanation && (
            <div style={explanationSectionStyle}>
              <h4 style={sectionTitleHighlightedStyle}><TcgIcon name="spark" size={18} /> POURQUOI C'EST INTÉRESSANT</h4>
              <div style={markdownContainerStyle}>
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p style={markdownParagraphStyle} {...props} />,
                    strong: ({ node, ...props }) => <strong style={markdownStrongStyle} {...props} />,
                    ul: ({ node, ...props }) => <ul style={markdownListStyle} {...props} />,
                    li: ({ node, ...props }) => <li style={markdownListItemStyle} {...props} />,
                  }}
                >
                  {listing.explanation}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {(qualityTier || positiveReasons.length > 0 || riskReasons.length > 0) && (
            <div style={decisionSectionStyle}>
              <h4 style={sectionTitleHighlightedStyle}><TcgIcon name="spark" size={18} /> DÉCISION RADAR</h4>
              {qualityTier && (
                <div style={decisionTierStyle}>{QUALITY_TIER_LABELS[qualityTier] || qualityTier}</div>
              )}
              <div style={decisionColumnsStyle}>
                {positiveReasons.length > 0 && (
                  <div>
                    <div style={decisionColumnTitleStyle}>Pourquoi c’est gardé</div>
                    <ul style={decisionListStyle}>
                      {positiveReasons.map((reason) => <li key={reason} style={positiveReasonStyle}>+ {reason}</li>)}
                    </ul>
                  </div>
                )}
                {riskReasons.length > 0 && (
                  <div>
                    <div style={decisionColumnTitleStyle}>Points à vérifier</div>
                    <ul style={decisionListStyle}>
                      {riskReasons.map((reason) => <li key={reason} style={riskReasonStyle}>- {reason}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION: Évaluation */}
          <div style={sectionContainerStyle}>
            <h4 style={sectionTitleStyle}><TcgIcon name="chart" size={18} /> ÉVALUATION</h4>
            <div style={evaluationGridStyle}>
              <EvaluationRow
                label="Risque"
                level={riskLevel}
                value={riskLevel.toUpperCase()}
                dots={riskDots}
              />
              <EvaluationRow
                label="Confiance"
                level={confidence > 70 ? 'high' : 'medium'}
                value={`${confidence}%`}
                dots={Math.round(confidence / 20)}
              />
              <EvaluationRow
                label="Compétition"
                level="low"
                value={`FAIBLE${listing.view_count ? ` (${listing.view_count} vues)` : ''}`}
                dots={1}
              />
              <div style={actionSuggestedStyle}>
                <span style={detailLabelStyle}>Action suggérée:</span>
                <span style={actionValueStyle}><TcgIcon name="bolt" size={16} /> {ACTION_LABELS[actionSuggestion] || 'Examiner'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="lot-modal-footer" style={footerStyle}>
          <button className="lot-modal-action" onClick={handleViewListing} style={primaryButtonStyle}>
            <TcgIcon name="link" size={16} /> Voir l'annonce
          </button>
          <button className="lot-modal-action" onClick={handleAddToWatchlist} style={secondaryButtonStyle}>
            <TcgIcon name="watch" size={16} /> Watchlist
          </button>
          <button className="lot-modal-action" onClick={handleIgnore} style={tertiaryButtonStyle}>
            <TcgIcon name="ignore" size={16} /> Ignorer
          </button>
          <button className="lot-modal-action" onClick={handleMarkContacted} style={successButtonStyle}>
            <TcgIcon name="contacted" size={16} /> Contacté
          </button>
          <button className="lot-modal-action" onClick={handleDelete} style={dangerButtonStyle}>
            <TcgIcon name="risk" size={16} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function shouldDisplayOpportunitySignal(listing, signal) {
  if (!isLotSignal(signal)) return true;
  return isLotListing(listing);
}

function isLotSignal(signal) {
  return ['lot_detected', 'LOT', 'lot'].includes(signal);
}

function isLotListing(listing) {
  const text = `${listing.title || ''} ${listing.description || ''}`;
  if (/\b(carte seule|carte unique|à l'unité|a l'unite|unitaire|single card)\b/i.test(text)) return false;
  return /\b(lot|collection|vrac|classeur|set complet|complete set)\b/i.test(text)
    || /\b([2-9]|[1-9]\d+)\s*(cartes?|cards?)\b/i.test(text);
}

// ==================== EVALUATION ROW COMPONENT ====================
function EvaluationRow({ label, level, value, dots }) {
  const maxDots = 5;
  const filledDots = dots || 0;
  const emptyDots = maxDots - filledDots;

  const dotColor = level === 'low' ? theme.accents.successGreen : level === 'medium' ? theme.accents.hunterGold : theme.accents.preyRed;

  return (
    <div style={evaluationRowStyle}>
      <span style={detailLabelStyle}>{label}:</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Array.from({ length: filledDots }).map((_, i) => (
            <span key={`filled-${i}`} style={{ color: dotColor, fontSize: '20px' }}>●</span>
          ))}
          {Array.from({ length: emptyDots }).map((_, i) => (
            <span key={`empty-${i}`} style={{ color: theme.colors.primary.slate, fontSize: '20px' }}>○</span>
          ))}
        </div>
        <span style={{ color: dotColor, fontWeight: theme.typography.weights.medium }}>{value}</span>
      </div>
    </div>
  );
}

const responsiveCss = `
  @media (max-width: 700px) {
    .lot-modal-overlay { padding: 0 !important; align-items: stretch !important; }
    .lot-modal { width: 100vw !important; height: 100dvh !important; max-width: none !important; max-height: none !important; border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
    .lot-modal-header { padding: 10px 12px !important; gap: 8px !important; }
    .lot-modal-title { font-size: 14px !important; letter-spacing: .8px !important; text-align: center !important; }
    .lot-modal-score { font-size: 13px !important; padding: 6px 8px !important; white-space: nowrap !important; }
    .lot-modal-body { padding: 12px !important; }
    .lot-modal-media-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
    .lot-modal-carousel { aspect-ratio: 4 / 3 !important; max-height: 38vh !important; }
    .lot-modal-listing-title { font-size: 16px !important; line-height: 1.3 !important; }
    .lot-modal-price-row { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
    .lot-modal-price { font-size: 32px !important; }
    .lot-modal-footer { grid-template-columns: 1fr 1fr !important; gap: 8px !important; padding: 10px !important; }
    .lot-modal-action { font-size: 13px !important; padding: 10px 8px !important; min-height: 42px !important; }
  }
`;

// ==================== STYLES ====================

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(10, 14, 39, 0.95)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: theme.spacing.lg,
};

const modalStyle = {
  position: 'relative',
  width: '90vw',
  maxWidth: '1200px',
  height: '90vh',
  maxHeight: '900px',
  background: theme.colors.primary.deepDark,
  borderRadius: theme.borders.radiusLarge,
  border: `2px solid ${theme.accents.hunterGold}`,
  boxShadow: `0 0 48px ${theme.accents.hunterGold}40`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  outline: 'none',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing.lg,
  background: theme.colors.primary.midnight,
  borderBottom: `2px solid ${theme.accents.hunterGold}`,
  flexShrink: 0,
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: theme.colors.text.secondary,
  fontSize: theme.typography.sizes.headingLg,
  cursor: 'pointer',
  padding: theme.spacing.sm,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.borders.radiusSmall,
  transition: 'all 0.2s ease',
  ':hover': {
    background: theme.accents.preyRed + '20',
    color: theme.accents.preyRed,
  },
};

const titleStyle = {
  fontSize: theme.typography.sizes.headingLg,
  fontWeight: theme.typography.weights.bold,
  color: theme.colors.text.primary,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  margin: 0,
  textShadow: `0 0 16px ${theme.accents.hunterGold}60`,
};

const scoreBadgeStyle = {
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  background: `linear-gradient(135deg, ${theme.accents.hunterGold}, ${theme.accents.manaCyan})`,
  borderRadius: theme.borders.radiusMedium,
  color: theme.colors.primary.obsidian,
  fontSize: theme.typography.sizes.headingMd,
  fontWeight: theme.typography.weights.bold,
  boxShadow: `0 0 20px ${theme.accents.hunterGold}80`,
};

const bodyStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing.xl,
  background: theme.colors.primary.obsidian,
};

const mediaGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing.xl,
  marginBottom: theme.spacing.xl,
};

// Carousel
const carouselContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.md,
};

const carouselMainImageStyle = {
  position: 'relative',
  width: '100%',
  aspectRatio: '1',
  background: theme.colors.primary.slate,
  borderRadius: theme.borders.radiusMedium,
  overflow: 'hidden',
};

const mainImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const carouselButtonLeftStyle = {
  position: 'absolute',
  top: '50%',
  left: theme.spacing.md,
  transform: 'translateY(-50%)',
  background: 'rgba(18, 22, 51, 0.8)',
  border: `2px solid ${theme.colors.primary.slate}`,
  color: theme.accents.hunterGold,
  fontSize: theme.typography.sizes.headingMd,
  padding: theme.spacing.sm,
  borderRadius: theme.borders.radiusSmall,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  ':hover': {
    background: 'rgba(18, 22, 51, 1)',
    boxShadow: `0 0 10px ${theme.accents.hunterGold}60`,
  },
};

const carouselButtonRightStyle = {
  ...carouselButtonLeftStyle,
  left: 'auto',
  right: theme.spacing.md,
};

const carouselIndicatorStyle = {
  position: 'absolute',
  bottom: theme.spacing.md,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(10, 14, 39, 0.9)',
  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
  borderRadius: theme.borders.radiusSmall,
  color: theme.colors.text.secondary,
  fontSize: theme.typography.sizes.bodyMd,
  fontWeight: theme.typography.weights.medium,
};

const thumbnailsContainerStyle = {
  display: 'flex',
  gap: theme.spacing.sm,
  justifyContent: 'center',
};

const thumbnailStyle = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  borderRadius: theme.borders.radiusSmall,
  border: `2px solid ${theme.colors.primary.slate}`,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

// Price Block
const priceBlockContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.md,
  alignItems: 'center',
};

const listingTitleStyle = {
  fontSize: theme.typography.sizes.headingMd,
  fontWeight: theme.typography.weights.bold,
  color: theme.accents.hunterGold,
  margin: 0,
  textShadow: `0 0 12px ${theme.accents.hunterGold}60`,
};

const priceRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: theme.spacing.md,
};

const labelSmallStyle = {
  fontSize: theme.typography.sizes.bodyMd,
  color: theme.colors.text.tertiary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: theme.spacing.xs,
};

const priceValueStyle = {
  fontSize: theme.typography.sizes.display,
  fontWeight: theme.typography.weights.bold,
  color: theme.accents.hunterGold,
  textShadow: `0 0 16px ${theme.accents.hunterGold}80`,
};

const estimationValueStyle = {
  fontSize: theme.typography.sizes.headingLg,
  fontWeight: theme.typography.weights.bold,
  color: theme.accents.manaCyan,
  textShadow: `0 0 12px ${theme.accents.manaCyan}60`,
};

const potentialBlockStyle = {
  padding: theme.spacing.md,
  background: `${theme.accents.successGreen}10`,
  borderRadius: theme.borders.radiusMedium,
  border: `1px solid ${theme.accents.successGreen}40`,
};

const potentialValueStyle = (min, max) => ({
  fontSize: theme.typography.sizes.headingMd,
  fontWeight: theme.typography.weights.bold,
  color: min > 0 ? theme.accents.successGreen : theme.accents.preyRed,
  textShadow: min > 0 ? `0 0 12px ${theme.accents.successGreen}60` : 'none',
});

const badgesContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing.sm,
  marginTop: theme.spacing.md,
};

// Sections
const sectionContainerStyle = {
  background: theme.colors.primary.deepDark,
  border: `1px solid ${theme.colors.primary.slate}`,
  borderRadius: theme.borders.radiusLarge,
  padding: theme.spacing.lg,
  marginBottom: theme.spacing.lg,
};

const explanationSectionStyle = {
  ...sectionContainerStyle,
  border: `2px solid ${theme.accents.hunterGold}`,
};

const sectionTitleStyle = {
  fontSize: theme.typography.sizes.bodyLg,
  fontWeight: theme.typography.weights.bold,
  color: theme.accents.hunterGold,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginTop: 0,
  marginBottom: theme.spacing.md,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
};

const sectionTitleHighlightedStyle = {
  ...sectionTitleStyle,
  textShadow: `0 0 12px ${theme.accents.hunterGold}60`,
};

const decisionSectionStyle = {
  ...sectionContainerStyle,
  border: `1px solid ${theme.accents.manaCyan}55`,
  background: `linear-gradient(135deg, ${theme.colors.primary.deepDark}, ${theme.accents.manaCyan}0D)`,
};

const decisionTierStyle = {
  display: 'inline-flex',
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  borderRadius: theme.borders.radiusMd,
  border: `1px solid ${theme.accents.hunterGold}66`,
  color: theme.accents.hunterGold,
  background: `${theme.accents.hunterGold}12`,
  fontWeight: theme.typography.weights.bold,
  marginBottom: theme.spacing.md,
};

const decisionColumnsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: theme.spacing.lg,
};

const decisionColumnTitleStyle = {
  color: theme.colors.text.tertiary,
  fontSize: theme.typography.sizes.bodySm,
  fontWeight: theme.typography.weights.semibold,
  textTransform: 'uppercase',
  marginBottom: theme.spacing.sm,
};

const decisionListStyle = {
  margin: 0,
  paddingLeft: theme.spacing.lg,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.xs,
};

const positiveReasonStyle = {
  color: theme.accents.successGreen,
  fontSize: theme.typography.sizes.bodySm,
};

const riskReasonStyle = {
  color: theme.accents.warningOrange,
  fontSize: theme.typography.sizes.bodySm,
};

// Details Grid
const detailsGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.sm,
};

const detailRowStyle = {
  display: 'grid',
  gridTemplateColumns: '140px 1fr',
  gap: theme.spacing.md,
  padding: theme.spacing.sm,
  borderBottom: `1px solid ${theme.colors.primary.slate}`,
};

const detailLabelStyle = {
  fontSize: theme.typography.sizes.bodyMd,
  color: theme.colors.text.tertiary,
  fontWeight: theme.typography.weights.medium,
};

const detailValueStyle = {
  fontSize: theme.typography.sizes.bodyLg,
  color: theme.colors.text.secondary,
  fontWeight: theme.typography.weights.medium,
};

const distanceStyle = (distance) => ({
  ...detailValueStyle,
  color: distance && distance < 20 ? theme.accents.successGreen : theme.colors.text.secondary,
  fontWeight: distance && distance < 20 ? theme.typography.weights.bold : theme.typography.weights.medium,
});

// Markdown
const markdownContainerStyle = {
  fontSize: theme.typography.sizes.bodyLg,
  lineHeight: 1.6,
  color: theme.colors.text.secondary,
};

const markdownParagraphStyle = {
  marginTop: theme.spacing.sm,
  marginBottom: theme.spacing.sm,
};

const markdownStrongStyle = {
  color: theme.accents.hunterGold,
  fontWeight: theme.typography.weights.bold,
};

const markdownListStyle = {
  listStyleType: 'none',
  padding: 0,
  margin: 0,
};

const markdownListItemStyle = {
  paddingLeft: theme.spacing.lg,
  marginBottom: theme.spacing.xs,
  position: 'relative',
};

// Evaluation
const evaluationGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.md,
};

const evaluationRowStyle = {
  display: 'grid',
  gridTemplateColumns: '140px 1fr',
  gap: theme.spacing.md,
  alignItems: 'center',
  padding: theme.spacing.sm,
};

const actionSuggestedStyle = {
  ...detailRowStyle,
  borderTop: `2px solid ${theme.accents.hunterGold}`,
  paddingTop: theme.spacing.md,
  marginTop: theme.spacing.sm,
  borderBottom: 'none',
};

const actionValueStyle = {
  ...detailValueStyle,
  color: theme.accents.hunterGold,
  fontWeight: theme.typography.weights.bold,
  textShadow: `0 0 12px ${theme.accents.hunterGold}60`,
};

// Footer Actions
const footerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: theme.spacing.md,
  padding: theme.spacing.lg,
  background: theme.colors.primary.midnight,
  borderTop: `2px solid ${theme.accents.hunterGold}`,
  flexShrink: 0,
};

const primaryButtonStyle = {
  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  background: `linear-gradient(135deg, ${theme.accents.hunterGold}, ${theme.accents.manaCyan})`,
  border: 'none',
  borderRadius: theme.borders.radiusMedium,
  color: theme.colors.primary.obsidian,
  fontSize: theme.typography.sizes.bodyLg,
  fontWeight: theme.typography.weights.bold,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: `0 4px 12px ${theme.accents.hunterGold}40`,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.sm,
};

const secondaryButtonStyle = {
  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  background: 'transparent',
  border: `2px solid ${theme.accents.manaCyan}`,
  borderRadius: theme.borders.radiusMedium,
  color: theme.accents.manaCyan,
  fontSize: theme.typography.sizes.bodyLg,
  fontWeight: theme.typography.weights.bold,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.sm,
};

const tertiaryButtonStyle = {
  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
  background: 'transparent',
  border: `2px solid ${theme.colors.primary.slate}`,
  borderRadius: theme.borders.radiusMedium,
  color: theme.colors.text.muted,
  fontSize: theme.typography.sizes.bodyLg,
  fontWeight: theme.typography.weights.medium,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.sm,
};

const successButtonStyle = {
  ...secondaryButtonStyle,
  borderColor: theme.accents.successGreen,
  color: theme.accents.successGreen,
};

const dangerButtonStyle = {
  ...secondaryButtonStyle,
  borderColor: theme.accents.preyRed,
  color: theme.accents.preyRed,
};

export default LotDetailModal;
