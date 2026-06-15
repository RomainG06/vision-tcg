-- Vision TCG Database Schema
-- MVP pour détection et priorisation de lots de cartes Pokémon

CREATE TABLE IF NOT EXISTS scrape_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  source TEXT NOT NULL,
  query TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  results_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scrape_run_id INTEGER NOT NULL,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  location TEXT,
  lat REAL,
  lon REAL,
  distance_km REAL,
  images TEXT,
  posted_at TEXT,
  scraped_at TEXT NOT NULL,
  raw_html TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  score REAL DEFAULT 0,
  score_breakdown TEXT,
  notes TEXT,
  FOREIGN KEY (scrape_run_id) REFERENCES scrape_runs(id),
  UNIQUE(source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_listings_score ON listings(score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);
CREATE INDEX IF NOT EXISTS idx_listings_scrape_run ON listings(scrape_run_id);
