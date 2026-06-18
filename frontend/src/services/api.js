const API_URL = import.meta.env.VITE_API_URL || '';

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

/**
 * Fetch statistics
 */
export async function fetchStats() {
  const response = await fetch(`${API_URL}/api/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');

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
  const response = await fetch(`${API_URL}/api/scrape/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Failed to start scrape');
    error.status = response.status;
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
