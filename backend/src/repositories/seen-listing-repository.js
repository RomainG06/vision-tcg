import { all, run } from '../db/database.js';

function isoNow() {
  return new Date().toISOString();
}

function defaultSkipUntil(decision, rejectionReason) {
  const now = Date.now();
  const hours = rejectionReason === 'over_budget'
    ? 24
    : decision === 'kept'
      ? 24 * 7
      : 24 * 7;
  return new Date(now + hours * 60 * 60 * 1000).toISOString();
}

export class SeenListingRepository {
  findExcludedExternalIdsBySource(source, options = {}) {
    const { targetSeries = 'all', now = isoNow() } = options;
    return all(
      `SELECT external_id
       FROM seen_listings
       WHERE source = ?
         AND skip_until IS NOT NULL
         AND skip_until > ?
         AND (target_series = ? OR target_series = 'all' OR ? = 'all')`,
      [source, now, targetSeries, targetSeries]
    )
      .map(row => String(row.external_id))
      .filter(Boolean);
  }

  markSeen(item = {}) {
    const now = isoNow();
    const source = item.source || item.platform;
    const externalId = item.external_id || item.id;
    if (!source || !externalId) return null;

    const decision = item.last_decision || item.decision || 'seen';
    const rejectionReason = item.last_rejection_reason || item.rejection_reason || null;
    const skipUntil = item.skip_until || defaultSkipUntil(decision, rejectionReason);

    run(
      `INSERT INTO seen_listings (
        source, external_id, url, title, target_series, first_seen_at, last_seen_at,
        seen_count, last_query, last_decision, last_rejection_reason, skip_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
      ON CONFLICT(source, external_id, target_series) DO UPDATE SET
        url = COALESCE(excluded.url, seen_listings.url),
        title = COALESCE(excluded.title, seen_listings.title),
        last_seen_at = excluded.last_seen_at,
        seen_count = seen_count + 1,
        last_query = excluded.last_query,
        last_decision = excluded.last_decision,
        last_rejection_reason = excluded.last_rejection_reason,
        skip_until = excluded.skip_until`,
      [
        source,
        String(externalId),
        item.url || null,
        item.title || null,
        item.target_series || item.targetSeries || 'all',
        now,
        now,
        item.last_query || item.query || null,
        decision,
        rejectionReason,
        skipUntil,
      ]
    );

    return String(externalId);
  }

  markManySeen(items = [], defaults = {}) {
    let count = 0;
    for (const item of items) {
      const marked = this.markSeen({ ...defaults, ...item });
      if (marked) count++;
    }
    return count;
  }
}
