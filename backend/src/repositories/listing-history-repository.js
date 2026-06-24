import { all, get, run } from '../db/database.js';

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function computePriceDrop(firstPrice, currentPrice) {
  const first = Number(firstPrice || 0);
  const current = Number(currentPrice || 0);
  if (first <= 0 || current >= first) {
    return { amount: 0, percent: 0 };
  }

  const amount = roundMoney(first - current);
  const percent = Math.round((amount / first) * 1000) / 10;
  return { amount, percent };
}

export class ListingHistoryRepository {
  recordDetection(listing, previousListing = null) {
    const now = listing.scraped_at || new Date().toISOString();
    const price = Number(listing.price || 0);
    const existing = this.getListingHistory(listing.id);

    if (!existing) {
      run(`
        INSERT INTO listing_history (
          listing_id, source, external_id, first_detected_at, last_detected_at,
          detection_count, first_price, current_price, lowest_price, highest_price,
          last_status, last_scrape_run_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        listing.id,
        listing.source,
        listing.external_id,
        now,
        now,
        1,
        price,
        price,
        price,
        price,
        listing.status || 'new',
        listing.scrape_run_id,
      ]);
    } else {
      run(`
        UPDATE listing_history
        SET last_detected_at = ?,
            detection_count = detection_count + 1,
            current_price = ?,
            lowest_price = MIN(lowest_price, ?),
            highest_price = MAX(highest_price, ?),
            last_status = ?,
            last_scrape_run_id = ?
        WHERE listing_id = ?
      `, [
        now,
        price,
        price,
        price,
        listing.status || existing.last_status || 'new',
        listing.scrape_run_id,
        listing.id,
      ]);
    }

    const previousPrice = previousListing ? Number(previousListing.price || 0) : null;
    if (previousPrice === null || previousPrice !== price) {
      run(`
        INSERT INTO listing_price_events (listing_id, price, detected_at, scrape_run_id)
        VALUES (?, ?, ?, ?)
      `, [listing.id, price, now, listing.scrape_run_id]);
    }

    return this.getListingHistory(listing.id);
  }

  getListingHistory(listingId) {
    const row = get('SELECT * FROM listing_history WHERE listing_id = ?', [listingId]);
    if (!row) return null;

    const drop = computePriceDrop(row.first_price, row.current_price);
    return {
      ...row,
      price_drop_amount: drop.amount,
      price_drop_percent: drop.percent,
    };
  }

  getPriceEvents(listingId) {
    return all(
      'SELECT * FROM listing_price_events WHERE listing_id = ? ORDER BY datetime(detected_at) DESC, id DESC',
      [listingId]
    );
  }

  getSummary() {
    const totals = get(`
      SELECT
        COUNT(*) as tracked,
        SUM(CASE WHEN detection_count > 1 THEN 1 ELSE 0 END) as seen_again,
        SUM(CASE WHEN current_price < first_price THEN 1 ELSE 0 END) as price_drops
      FROM listing_history
    `);

    return {
      tracked: totals?.tracked || 0,
      seen_again: totals?.seen_again || 0,
      price_drops: totals?.price_drops || 0,
    };
  }
}
