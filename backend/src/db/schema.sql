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

CREATE TABLE IF NOT EXISTS seen_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  url TEXT,
  title TEXT,
  target_series TEXT NOT NULL DEFAULT 'all',
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  seen_count INTEGER NOT NULL DEFAULT 1,
  last_query TEXT,
  last_decision TEXT,
  last_rejection_reason TEXT,
  skip_until TEXT,
  UNIQUE(source, external_id, target_series)
);

CREATE INDEX IF NOT EXISTS idx_seen_source_series_skip ON seen_listings(source, target_series, skip_until);
CREATE INDEX IF NOT EXISTS idx_seen_source_external ON seen_listings(source, external_id);

CREATE TABLE IF NOT EXISTS listing_history (
  listing_id INTEGER PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  first_detected_at TEXT NOT NULL,
  last_detected_at TEXT NOT NULL,
  detection_count INTEGER NOT NULL DEFAULT 1,
  first_price REAL NOT NULL DEFAULT 0,
  current_price REAL NOT NULL DEFAULT 0,
  lowest_price REAL NOT NULL DEFAULT 0,
  highest_price REAL NOT NULL DEFAULT 0,
  last_status TEXT NOT NULL DEFAULT 'new',
  last_scrape_run_id INTEGER,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listing_price_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  price REAL NOT NULL,
  detected_at TEXT NOT NULL,
  scrape_run_id INTEGER,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS listing_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  score REAL,
  created_at TEXT NOT NULL,
  read_at TEXT,
  metadata TEXT,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  UNIQUE(listing_id, type)
);

CREATE INDEX IF NOT EXISTS idx_listing_history_source_external ON listing_history(source, external_id);
CREATE INDEX IF NOT EXISTS idx_listing_history_price_drop ON listing_history(current_price, first_price);
CREATE INDEX IF NOT EXISTS idx_listing_price_events_listing ON listing_price_events(listing_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_alerts_created ON listing_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_alerts_type ON listing_alerts(type);

-- Keywords for scoring
CREATE TABLE IF NOT EXISTS keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  weight REAL NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_keywords_active ON keywords(active);
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(category);
