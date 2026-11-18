export const LISTING_STATUSES = Object.freeze({
  NEW: 'new',
  INTERESTED: 'interested',
  REVIEWED: 'reviewed',
  IGNORED: 'ignored',
  CONTACTED: 'contacted',
  PURCHASED: 'purchased',
});

export const VALID_LISTING_STATUSES = Object.freeze(Object.values(LISTING_STATUSES));

const STATUS_ALIASES = Object.freeze({
  passed: LISTING_STATUSES.IGNORED,
  rejected: LISTING_STATUSES.IGNORED,
  ignored: LISTING_STATUSES.IGNORED,
  viewed: LISTING_STATUSES.REVIEWED,
  seen: LISTING_STATUSES.REVIEWED,
  reviewed: LISTING_STATUSES.REVIEWED,
  interesting: LISTING_STATUSES.INTERESTED,
  watchlist: LISTING_STATUSES.INTERESTED,
  interested: LISTING_STATUSES.INTERESTED,
  contacted: LISTING_STATUSES.CONTACTED,
  purchased: LISTING_STATUSES.PURCHASED,
  new: LISTING_STATUSES.NEW,
});

export function normalizeListingStatus(status) {
  const key = String(status || '').trim().toLowerCase();
  return STATUS_ALIASES[key] || null;
}

export function assertValidListingStatus(status) {
  const normalized = normalizeListingStatus(status);
  if (!normalized) {
    throw new Error(`Invalid listing status: ${status}`);
  }
  return normalized;
}
