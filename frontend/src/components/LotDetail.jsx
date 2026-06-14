import { updateListing } from '../services/api';

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
          <span style={styles.score}>Score: {listing.score}</span>
        </div>

        {listing.image_url && (
          <img
            src={listing.image_url}
            alt={listing.title}
            style={styles.image}
          />
        )}

        <div style={styles.section}>
          <h3>Détails</h3>
          <div style={styles.details}>
            <div><strong>Prix:</strong> {listing.price}€</div>
            <div><strong>Localisation:</strong> {listing.location} ({listing.distance_km}km)</div>
            <div><strong>Source:</strong> {listing.source}</div>
            {listing.card_count_estimate && (
              <div><strong>Cartes estimées:</strong> {listing.card_count_estimate}</div>
            )}
            <div><strong>Posté:</strong> {listing.posted_at ? new Date(listing.posted_at).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>

        {listing.description && (
          <div style={styles.section}>
            <h3>Description</h3>
            <p style={styles.description}>{listing.description}</p>
          </div>
        )}

        <div style={styles.section}>
          <h3>Indicateurs</h3>
          <div style={styles.badges}>
            <span style={listing.is_wizards ? styles.badgeActive : styles.badgeInactive}>
              {listing.is_wizards ? '✓' : '✗'} Wizards
            </span>
            <span style={listing.is_french ? styles.badgeActive : styles.badgeInactive}>
              {listing.is_french ? '✓' : '✗'} Français
            </span>
            <span style={listing.is_lot ? styles.badgeActive : styles.badgeInactive}>
              {listing.is_lot ? '✓' : '✗'} Lot
            </span>
          </div>
        </div>

        <div style={styles.section}>
          <h3>Actions</h3>
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
              style={styles.btnSuccess}
              onClick={() => handleStatusChange('interested')}
            >
              ⭐ Marquer intéressant
            </button>
            <button
              style={styles.btnWarning}
              onClick={() => handleStatusChange('reviewed')}
            >
              👁 Marquer vu
            </button>
            <button
              style={styles.btnDanger}
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

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    padding: '30px'
  },
  closeBtn: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#999'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingRight: '30px'
  },
  title: {
    fontSize: '1.5rem',
    flex: 1
  },
  score: {
    background: '#667eea',
    color: 'white',
    padding: '5px 15px',
    borderRadius: '20px',
    fontWeight: 'bold'
  },
  image: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'contain',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  section: {
    marginBottom: '25px'
  },
  details: {
    display: 'grid',
    gap: '8px',
    marginTop: '10px'
  },
  description: {
    lineHeight: '1.6',
    color: '#555',
    marginTop: '10px'
  },
  badges: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  badgeActive: {
    padding: '8px 16px',
    background: '#4caf50',
    color: 'white',
    borderRadius: '6px',
    fontSize: '0.9rem'
  },
  badgeInactive: {
    padding: '8px 16px',
    background: '#f0f0f0',
    color: '#999',
    borderRadius: '6px',
    fontSize: '0.9rem'
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '10px',
    marginTop: '15px'
  },
  btnPrimary: {
    padding: '12px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    fontSize: '0.95rem'
  },
  btnSuccess: {
    padding: '12px 20px',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem'
  },
  btnWarning: {
    padding: '12px 20px',
    background: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem'
  },
  btnDanger: {
    padding: '12px 20px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem'
  }
};

export default LotDetail;
