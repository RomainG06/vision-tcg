-- Schema pour la base de données SQLite
-- Tables: listings, scrape_runs, keywords

CREATE TABLE IF NOT EXISTS scrape_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed', 'interrupted')),
    source TEXT NOT NULL,
    query TEXT NOT NULL,
    total_found INTEGER DEFAULT 0,
    errors TEXT
);

CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scrape_run_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    price REAL,
    location TEXT,
    lat REAL,
    lon REAL,
    distance_km REAL,
    image_url TEXT,
    posted_at TEXT,
    scraped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Scoring fields
    score REAL DEFAULT 0,
    is_wizards BOOLEAN DEFAULT 0,
    is_french BOOLEAN DEFAULT 0,
    is_lot BOOLEAN DEFAULT 0,
    card_count_estimate INTEGER,
    
    -- Status
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'reviewed', 'interested', 'passed', 'contacted')),
    notes TEXT,
    
    FOREIGN KEY (scrape_run_id) REFERENCES scrape_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_listings_scrape_run ON listings(scrape_run_id);
CREATE INDEX IF NOT EXISTS idx_listings_score ON listings(score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source);

CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK(category IN ('wizards', 'edition', 'language', 'negative')),
    weight REAL DEFAULT 1.0
);

-- Seed initial keywords
INSERT OR IGNORE INTO keywords (keyword, category, weight) VALUES
    -- Éditions Wizards
    ('wizards', 'wizards', 2.0),
    ('wotc', 'wizards', 2.0),
    ('base set', 'edition', 1.8),
    ('jungle', 'edition', 1.8),
    ('fossil', 'edition', 1.8),
    ('team rocket', 'edition', 1.8),
    ('gym heroes', 'edition', 1.7),
    ('gym challenge', 'edition', 1.7),
    ('neo genesis', 'edition', 1.6),
    ('neo discovery', 'edition', 1.6),
    ('neo revelation', 'edition', 1.6),
    ('neo destiny', 'edition', 1.6),
    
    -- Language indicators
    ('français', 'language', 1.5),
    ('french', 'language', 1.5),
    ('fr', 'language', 1.3),
    
    -- Negative signals
    ('japonais', 'negative', -1.0),
    ('japanese', 'negative', -1.0),
    ('anglais', 'negative', -0.5),
    ('english', 'negative', -0.5);
