function FilterBar({ filters, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div style={styles.container}>
      <div style={styles.filterGroup}>
        <label style={styles.label}>Statut</label>
        <select
          style={styles.select}
          value={filters.status}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="all">Tous</option>
          <option value="new">Nouveaux</option>
          <option value="interested">Intéressants</option>
          <option value="reviewed">Vus</option>
          <option value="passed">Passés</option>
        </select>
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Score min: {filters.minScore}</label>
        <input
          type="range"
          style={styles.range}
          min="0"
          max="100"
          value={filters.minScore}
          onChange={(e) => handleChange('minScore', parseInt(e.target.value))}
        />
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Prix max: {filters.maxPrice}€</label>
        <input
          type="range"
          style={styles.range}
          min="0"
          max="2000"
          step="50"
          value={filters.maxPrice}
          onChange={(e) => handleChange('maxPrice', parseInt(e.target.value))}
        />
      </div>

      <div style={styles.filterGroup}>
        <label style={styles.label}>Distance max: {filters.maxDistance}km</label>
        <input
          type="range"
          style={styles.range}
          min="0"
          max="100"
          step="5"
          value={filters.maxDistance}
          onChange={(e) => handleChange('maxDistance', parseInt(e.target.value))}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#555'
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem'
  },
  range: {
    width: '100%'
  }
};

export default FilterBar;
