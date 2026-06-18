import { useState, useEffect, useRef } from 'react';
import FilterBar from './components/FilterBar';
import LotList from './components/LotList';
import HuntLaunchPanel from './components/HuntLaunchPanel';
import { fetchListings, fetchStats, updateListing, deleteListing } from './services/api';
import theme from './theme';
import TcgIcon from './components/TcgIcon';

function App() {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'date',
    minScore: 0,
    maxPrice: 1500,
    maxDistance: 50,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastHunt, setLastHunt] = useState(null);
  const resultsRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [listings, filters, lastHunt]);

  const loadData = async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) setLoading(true);
      const [listingsData, statsData] = await Promise.all([
        fetchListings(),
        fetchStats(),
      ]);
      setListings(listingsData);
      setStats(statsData);
      return listingsData;
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    if (filters.status !== 'all') {
      filtered = filtered.filter(l => l.status === filters.status);
    }

    filtered = filtered.filter(l => {
      const score = Number(l.score || 0);
      const price = Number(l.price || 0);
      const distance = l.distance_km === null || l.distance_km === undefined ? 0 : Number(l.distance_km);
      return score >= filters.minScore &&
        price <= filters.maxPrice &&
        distance <= filters.maxDistance;
    });

    filtered.sort((a, b) => {
      const lastScanDelta = Number((lastHunt?.highlightedIds || []).includes(b.id)) - Number((lastHunt?.highlightedIds || []).includes(a.id));
      if (lastScanDelta !== 0) return lastScanDelta;

      if (filters.sortBy === 'score') return Number(b.score || 0) - Number(a.score || 0);
      if (filters.sortBy === 'price') return Number(a.price || 0) - Number(b.price || 0);

      const runDelta = Number(b.scrape_run_id || 0) - Number(a.scrape_run_id || 0);
      if (runDelta !== 0) return runDelta;
      return new Date(b.scraped_at || b.published_at || 0) - new Date(a.scraped_at || a.published_at || 0);
    });

    setFilteredListings(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleHuntComplete = async (scanResult = {}) => {
    const refreshedListings = await loadData({ showLoading: false });
    const idsFromScan = (scanResult.listings || scanResult.results || [])
      .map((listing) => listing.id)
      .filter(Boolean);

    const highlightedIds = idsFromScan.length > 0
      ? idsFromScan
      : [...(refreshedListings || [])]
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 5)
          .map((listing) => listing.id);

    setLastHunt({
      at: new Date(),
      count: scanResult.stats?.filtered ?? scanResult.stats?.total_results ?? scanResult.listings?.length ?? highlightedIds.length,
      highlightedIds,
    });

    setTimeout(scrollToResults, 120);
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
      return updated;
    } catch (err) {
      console.error('Failed to update listing:', err);
      throw err;
    }
  };

  const handleListingDelete = async (id) => {
    try {
      await deleteListing(id);
      setListings(prevListings => prevListings.filter(l => l.id !== id));
      setLastHunt(prev => prev ? {
        ...prev,
        highlightedIds: prev.highlightedIds.filter(highlightedId => highlightedId !== id),
      } : prev);
      const statsData = await fetchStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to delete listing:', err);
      throw err;
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
        <div style={styles.errorIcon}><TcgIcon name="risk" size={54} /></div>
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
            <span style={styles.titleIcon}><TcgIcon name="radar" size={46} /></span> Hunting Dashboard
          </h1>
          <p style={styles.subtitle}>
            Radar d'opportunités pour collectionneurs{' '}
            <span style={styles.subtitleHighlight}>Pokémon Wizards FR</span>
          </p>
        </div>
      </header>

      <div style={styles.container}>
        <HuntLaunchPanel
          onHuntComplete={handleHuntComplete}
          onViewResults={scrollToResults}
          hasResults={Boolean(lastHunt)}
        />

        <div ref={resultsRef} style={styles.resultsAnchor} />

        {lastHunt && (
          <div style={styles.scanBanner}>
            <span style={styles.scanBannerIcon}><TcgIcon name="spark" size={16} /></span>
            <span>Dernière chasse : {lastHunt.count} pistes mises en avant.</span>
            <button type="button" onClick={() => setLastHunt(null)} style={styles.scanBannerButton}>Tout afficher normalement</button>
          </div>
        )}

        <FilterBar filters={filters} onChange={handleFilterChange} />

        {stats && (
          <div style={styles.stats}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total annonces</div>
              <div style={styles.statValue}>{stats.total_listings ?? stats.total ?? 0}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Score moyen</div>
              <div style={styles.statValue}>
                {(stats.avg_score ?? stats.avgScore) ? (stats.avg_score ?? stats.avgScore).toFixed(1) : '0'}
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Prix moyen</div>
              <div style={styles.statValue}>
                {(stats.avg_price ?? stats.avgPrice) ? Math.round(stats.avg_price ?? stats.avgPrice) : '0'}€
              </div>
            </div>
            <button type="button" style={styles.statCardButton} onClick={() => handleFilterChange({ status: 'interested' })}>
              <div style={styles.statLabel}>Watchlist</div>
              <div style={styles.statValue}>{stats.watchlist ?? stats.interesting ?? 0}</div>
            </button>
            <button type="button" style={styles.statCardButton} onClick={() => handleFilterChange({ status: 'contacted' })}>
              <div style={styles.statLabel}>Contactés</div>
              <div style={styles.statValue}>{stats.contacted ?? 0}</div>
            </button>
            <button type="button" style={styles.statCardButton} onClick={() => handleFilterChange({ status: 'ignored' })}>
              <div style={styles.statLabel}>Ignorés</div>
              <div style={styles.statValue}>{stats.ignored ?? stats.passed ?? 0}</div>
            </button>
          </div>
        )}

        <LotList
          listings={filteredListings}
          onUpdate={handleListingUpdate}
          onDelete={handleListingDelete}
          highlightedIds={lastHunt?.highlightedIds || []}
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
    display: 'inline-flex',
    color: theme.accents.manaCyan,
    filter: `drop-shadow(0 0 12px ${theme.accents.manaCyan})`,
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
  resultsAnchor: {
    height: '1px',
    scrollMarginTop: theme.spacing.xl,
  },
  scanBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    marginBottom: theme.spacing.xl,
    border: `1px solid ${theme.accents.hunterGold}55`,
    borderRadius: theme.borders.radiusLg,
    background: `${theme.accents.hunterGold}12`,
    color: theme.colors.text.secondary,
    flexWrap: 'wrap',
  },
  scanBannerIcon: {
    display: 'inline-flex',
    color: theme.accents.hunterGold,
  },
  scanBannerButton: {
    border: 'none',
    background: 'transparent',
    color: theme.accents.manaCyan,
    cursor: 'pointer',
    fontWeight: theme.typography.weights.semibold,
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
  statCardButton: {
    background: theme.colors.primary.deepDark,
    border: `${theme.borders.widthMedium} solid ${theme.colors.primary.slate}`,
    borderRadius: theme.borders.radiusLg,
    padding: theme.spacing.xl,
    textAlign: 'center',
    boxShadow: theme.shadows.md,
    transition: `all ${theme.effects.transitionNormal}`,
    cursor: 'pointer',
    color: 'inherit',
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
