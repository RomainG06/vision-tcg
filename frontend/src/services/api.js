const API_URL = import.meta.env.VITE_API_URL || '';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableApiError(error) {
  const message = String(error?.message || error || '');
  return !error?.status
    || [408, 425, 429, 500, 502, 503, 504].includes(Number(error.status))
    || /failed to fetch|network|connexion|ECONN|timeout|temporarily/i.test(message);
}

async function fetchJsonWithRetry(url, init = {}, { attempts = 3, baseDelayMs = 700 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.message || data.error || `HTTP ${response.status}`);
        error.status = response.status;
        error.payload = data;
        throw error;
      }
      return data;
    } catch (error) {
      lastError = error;
      if (!isRetryableApiError(error) || attempt >= attempts) throw error;
      await delay(baseDelayMs * attempt);
    }
  }
  throw lastError;
}

/**
 * Fetch listings with filters
 */
export async function fetchListings(filters = {}) {
  const params = new URLSearchParams();
  
  // Default to 'all' to show all listings regardless of status
  params.append('status', filters.status || 'all');
  
  if (filters.minScore) params.append('min_score', filters.minScore);
  if (filters.maxPrice) params.append('max_price', filters.maxPrice);
  if (filters.maxDistance) params.append('max_distance', filters.maxDistance);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const response = await fetch(`${API_URL}/api/listings?${params}`);
  if (!response.ok) throw new Error('Failed to fetch listings');

  const data = await response.json();
  return data.listings || [];
}

/**
 * Fetch single listing
 */
export async function fetchListing(id) {
  const response = await fetch(`${API_URL}/api/listings/${id}`);
  if (!response.ok) throw new Error('Failed to fetch listing');

  return response.json();
}

/**
 * Update listing
 */
export async function updateListing(id, updates) {
  console.log('[API] updateListing called with:', { id, updates });
  
  if (!id || id === 'undefined') {
    console.error('[API] Invalid ID:', id);
    throw new Error(`Invalid listing ID: ${id}`);
  }
  
  const response = await fetch(`${API_URL}/api/listings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) throw new Error('Failed to update listing');

  return response.json();
}

export async function deleteListing(id) {
  const response = await fetch(`${API_URL}/api/listings/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) throw new Error('Failed to delete listing');
  return true;
}

export async function deleteAllListings() {
  const response = await fetch(`${API_URL}/api/listings`, {
    method: 'DELETE',
  });

  if (!response.ok) throw new Error('Failed to clear listings');
  return response.json();
}

/**
 * Fetch statistics
 */
export async function fetchStats() {
  const response = await fetch(`${API_URL}/api/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');

  return response.json();
}

export async function fetchAlerts({ limit = 5 } = {}) {
  const response = await fetch(`${API_URL}/api/alerts?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch alerts');

  return response.json();
}

/**
 * Fetch scrape runs history
 */
export async function fetchScrapeRuns() {
  const response = await fetch(`${API_URL}/api/scrape-runs`);
  if (!response.ok) throw new Error('Failed to fetch scrape runs');

  return response.json();
}

/**
 * Start a real marketplace scrape.
 * MVP endpoint is synchronous: it returns the scrape result once finished.
 */
export async function startScrape(options = {}) {
  const data = await fetchJsonWithRetry(`${API_URL}/api/scrape/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  }, { attempts: 3, baseDelayMs: 900 });

  if (data?.status === 'failed') {
    const error = new Error(data.message || data.error || 'Marketplace scrape failed');
    error.status = data.statusCode || 500;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function fetchJobStatus() {
  const response = await fetch(`${API_URL}/api/jobs/status`);
  if (!response.ok) throw new Error('Failed to fetch job status');
  return response.json();
}
