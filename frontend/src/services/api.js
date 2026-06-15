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
  
  const response = await fetch(`${API_URL}/api/listings?${params}`);
  if (!response.ok) throw new Error('Failed to fetch listings');
  
  return response.json();
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
  const response = await fetch(`${API_URL}/api/listings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) throw new Error('Failed to update listing');
  
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

/**
 * Fetch scrape runs history
 */
export async function fetchScrapeRuns() {
  const response = await fetch(`${API_URL}/api/scrape-runs`);
  if (!response.ok) throw new Error('Failed to fetch scrape runs');
  
  return response.json();
}
