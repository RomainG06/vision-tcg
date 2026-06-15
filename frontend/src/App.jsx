import { useState, useEffect } from 'react';
import FilterBar from './components/FilterBar';
import LotList from './components/LotList';
import { fetchListings, fetchStats, updateListing } from './services/api';
import theme from './theme';

function App() {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    minScore: 0,
    maxPrice: 1500,
    maxDistance: 50,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [listings, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listingsData, statsData] = await Promise.all([
        fetchListings(),
        fetchStats(),
      ]);
      setListings(listingsData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    if (filters.status !== 'all') {
      filtered = filtered.filter(l => l.status === filters.status);
    }

    filtered = filtered.filter(l =>
      l.score >= filters.minScore &&
      l.price <= filters.maxPrice &&
      l.distance_km <= filters.maxDistance
    );

    setFilteredListings(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleListingUpdate = async (id, updates) => {
    try {
      const updated = await updateListing(id, updates);
      
      // Update local state with the returned listing
      setListings(prevListings =>
        prevListings.map(l => l.id === id ? updated : l)
      );
      
      // Reload stats to reflect new counts
      const statsData = await fetchStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to update listing:', err);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Chargement des annonces...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <div style={styles.errorIcon}>⚠️</div>
        <div style={styles.errorText}>Erreur: {error}</div>
        <button style={styles.errorButton} onClick={loadData}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <span style={styles.titleIcon}>🎯</span> Hunting Dashboard
          </h1>
          <p style={styles.subtitle}>
            Radar d'opportunités pour collectionneurs{' '}
            <span style={styles.subtitleHighlight}>Pokémon Wizards FR</span>
          </p>
        </div>
      </header>

      <div style={styles.container}>
        <FilterBar filters={filters} onChange={handleFilterChange} />

        {stats && (
          <div style={styles.stats}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total annonces</div>
              <div style={styles.statValue}>{stats.total_listings || 0}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Score moyen</div>
              <div style={styles.statValue}>
                {stats.avg_score ? stats.avg_score.toFixed(1) : '0'}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Prix moyen</div>
              <div style={styles.statValue}>
                {stats.avg_price ? Math.round(stats.avg_price) : '0'}€
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Wizards FR</div>
              <div style={styles.statValue}>
                {stats.wizards_count || 0}
              </div>
            </div>
          </div>
        )}

        <LotList
          listings={filteredListings}
          onUpdate={handleListingUpdate}
        />
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: theme.colors.primary.obsidian,
    fontFamily: theme.typography.fonts.primary,
    color: theme.colors.text.primary,
    padding: theme.spacing.xl,
  },
  header: {
    textAlign: 'center',
    marginBottom: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xl,
    borderBottom: `${theme.borders.widthMedium} solid ${theme.accents.hunterGold}`,
    boxShadow: `0 4px 12px ${theme.accents.hunterGold}30`,
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  title: {
    fontFamily: theme.typography.fonts.heading,
    fontSize: theme.typography.sizes.display,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.primary,
    textShadow: `0 0 24px ${theme.accents.hunterGold}60`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  titleIcon: {
    fontSize: '48px',
    filter: `drop-shadow(0 0 12px ${theme.accents.hunterGold})`,
  },
  subtitle: {
    fontSize: theme.typography.sizes.bodyLg,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  subtitleHighlight: {
    color: theme.accents.manaCyan,
    fontWeight: theme.typography.weights.semibold,
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.xxxl,
  },
  statCard: {
    background: theme.colors.primary.deepDark,
    border: `${theme.borders.widthMedium} solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusLg,
    padding: theme.spacing.xl,
    textAlign: 'center',
    boxShadow: theme.shadows.md,
    transition: `all ${theme.effects.transitionNormal}`,
  },
  statLabel: {
    fontSize: theme.typography.sizes.bodySm,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: theme.typography.sizes.headingLg,
    fontWeight: theme.typography.weights.bold,
    color: theme.accents.hunterGold,
    textShadow: `0 0 16px ${theme.accents.hunterGold}80`,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: theme.colors.primary.obsidian,
    color: theme.colors.text.primary,
    gap: theme.spacing.xl,
  },
  loadingSpinner: {
    width: '64px',
    height: '64px',
    border: `4px solid ${theme.colors.primary.slate}`,
    borderTop: `4px solid ${theme.accents.manaCyan}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: theme.typography.sizes.bodyLg,
    color: theme.colors.text.secondary,
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: theme.colors.primary.obsidian,
    color: theme.colors.text.primary,
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.sizes.bodyLg,
    color: theme.accents.preyRed,
    textAlign: 'center',
  },
  errorButton: {
    background: theme.accents.hunterGold,
    color: theme.colors.primary.obsidian,
    border: 'none',
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    borderRadius: theme.borders.radiusMd,
    fontSize: theme.typography.sizes.bodyMd,
    fontWeight: theme.typography.weights.semibold,
    cursor: 'pointer',
    transition: `all ${theme.effects.transitionNormal}`,
    boxShadow: theme.shadows.md,
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default App;
