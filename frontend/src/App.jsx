import { useState, useEffect } from 'react';
import { fetchListings, fetchStats } from './services/api';
import LotList from './components/LotList';
import FilterBar from './components/FilterBar';

function App() {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: 'new',
    minScore: 0,
    maxPrice: 1500,
    maxDistance: 50
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listingsData, statsData] = await Promise.all([
        fetchListings(filters),
        fetchStats()
      ]);
      setListings(listingsData.listings);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎴 Vision TCG</h1>
        <p style={styles.subtitle}>Détection de lots Pokémon Wizards</p>
      </header>

      {stats && (
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total_listings}</div>
            <div style={styles.statLabel}>Annonces totales</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.wizards_count}</div>
            <div style={styles.statLabel}>Wizards détectés</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.high_score_count}</div>
            <div style={styles.statLabel}>Score &gt; 70</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>
              {stats.avg_score ? Math.round(stats.avg_score) : 0}
            </div>
            <div style={styles.statLabel}>Score moyen</div>
          </div>
        </div>
      )}

      <FilterBar filters={filters} onChange={setFilters} />

      {loading ? (
        <div style={styles.loading}>Chargement...</div>
      ) : (
        <LotList listings={listings} onUpdate={loadData} />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '10px',
    color: 'white'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '1.1rem',
    opacity: 0.9
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#667eea'
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '5px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '1.2rem',
    color: '#666'
  }
};

export default App;
