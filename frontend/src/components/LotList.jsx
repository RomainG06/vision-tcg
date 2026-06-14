import { useState } from 'react';
import LotDetail from './LotDetail';

function LotList({ listings, onUpdate }) {
  const [selectedLot, setSelectedLot] = useState(null);

  if (listings.length === 0) {
    return (
      <div style={styles.empty}>
        Aucune annonce trouvée avec ces filtres.
      </div>
    );
  }

  return (
    <div>
      <div style={styles.grid}>
        {listings.map((listing) => (
          <div
            key={listing.id}
            style={styles.card}
            onClick={() => setSelectedLot(listing)}
          >
            {listing.image_url && (
              <img
                src={listing.image_url}
                alt={listing.title}
                style={styles.image}
              />
            )}
            
            <div style={styles.content}>
              <div style={styles.header}>
                <span style={{
                  ...styles.score,
                  background: getScoreColor(listing.score)
                }}>
                  {listing.score}
                </span>
                <span style={styles.source}>{listing.source}</span>
              </div>
              
              <h3 style={styles.title}>{listing.title}</h3>
              
              <div style={styles.meta}>
                <span style={styles.price}>{listing.price}€</span>
                <span style={styles.location}>
                  📍 {listing.location} ({listing.distance_km}km)
                </span>
              </div>
              
              <div style={styles.badges}>
                {listing.is_wizards === 1 && (
                  <span style={styles.badge}>⭐ Wizards</span>
                )}
                {listing.is_french === 1 && (
                  <span style={styles.badge}>🇫🇷 Français</span>
                )}
                {listing.is_lot === 1 && (
                  <span style={styles.badge}>📦 Lot</span>
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

function getScoreColor(score) {
  if (score >= 80) return '#4caf50';
  if (score >= 60) return '#ff9800';
  return '#9e9e9e';
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
    }
  },
  image: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  content: {
    padding: '15px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  score: {
    padding: '4px 12px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  source: {
    fontSize: '0.8rem',
    color: '#999',
    textTransform: 'uppercase'
  },
  title: {
    fontSize: '1.1rem',
    marginBottom: '10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '0.9rem'
  },
  price: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: '#667eea'
  },
  location: {
    color: '#666',
    fontSize: '0.85rem'
  },
  badges: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap'
  },
  badge: {
    fontSize: '0.75rem',
    padding: '2px 8px',
    background: '#f0f0f0',
    borderRadius: '4px'
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    background: 'white',
    borderRadius: '8px'
  }
};

export default LotList;
