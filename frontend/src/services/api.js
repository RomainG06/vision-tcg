const API_URL = import.meta.env.VITE_API_URL || '';
const AUTH_TOKEN_STORAGE_KEY = 'vision-tcg.authToken';
const AUTH_USER_STORAGE_KEY = 'vision-tcg.authUser';

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
}

export function getStoredUser() {
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession({ token, user }) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  if (user) localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

function authHeaders(extra = {}) {
  const token = getAuthToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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

export async function loginWithAccessToken(accessToken) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: accessToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Connexion refusée');
    error.status = response.status;
    throw error;
  }
  setAuthSession({ token: data.token, user: data.user });
  return data;
}

export async function verifySession() {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    clearAuthSession();
    return null;
  }
  const data = await response.json();
  if (data.user) setAuthSession({ token: getAuthToken(), user: data.user });
  return data.user || null;
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

  const response = await fetch(`${API_URL}/api/listings?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch listings');

  const data = await response.json();
  return data.listings || [];
}

/**
 * Fetch single listing
 */
export async function fetchListing(id) {
  const response = await fetch(`${API_URL}/api/listings/${id}`, {
    headers: authHeaders(),
  });
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
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(updates)
  });

  if (!response.ok) throw new Error('Failed to update listing');

  return response.json();
}

export async function deleteListing(id) {
  const response = await fetch(`${API_URL}/api/listings/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error('Failed to delete listing');
  return true;
}

export async function deleteAllListings() {
  const response = await fetch(`${API_URL}/api/listings`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error('Failed to clear listings');
  return response.json();
}

/**
 * Fetch statistics
 */
export async function fetchStats() {
  const response = await fetch(`${API_URL}/api/stats`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch stats');

  return response.json();
}

export async function fetchAlerts({ limit = 5 } = {}) {
  const response = await fetch(`${API_URL}/api/alerts?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch alerts');

  return response.json();
}

/**
 * Fetch scrape runs history
 */
export async function fetchScrapeRuns() {
  const response = await fetch(`${API_URL}/api/scrape-runs`, {
    headers: authHeaders(),
  });
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
    headers: authHeaders({ 'Content-Type': 'application/json' }),
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
  const response = await fetch(`${API_URL}/api/jobs/status`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch job status');
  return response.json();
}
