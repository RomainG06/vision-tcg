import { all, get, run } from '../db/database.js';

const HIGH_SCORE_THRESHOLD = 80;
const PRICE_DROP_THRESHOLD_PERCENT = 10;

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export class AlertRepository {
  evaluateListing({ listing, previousListing = null, history = null }) {
    if (!listing) return [];

    const created = [];
    const score = Number(listing.score || 0);

    if (score >= HIGH_SCORE_THRESHOLD) {
      const alert = this.createOnce({
        listing_id: listing.id,
        type: 'high_score',
        severity: score >= 90 ? 'critical' : 'high',
        title: 'Opportunité à score élevé',
        message: `${listing.title} obtient un score de ${score}/100.`,
        score,
        metadata: {
          source: listing.source,
          external_id: listing.external_id,
          url: listing.url,
        },
      });
      if (alert) created.push(alert);
    }

    const previousPrice = Number(previousListing?.price || 0);
    const currentPrice = Number(listing.price || 0);
    if (previousPrice > 0 && currentPrice > 0 && currentPrice < previousPrice) {
      const amount = roundMoney(previousPrice - currentPrice);
      const percent = Math.round((amount / previousPrice) * 1000) / 10;

      if (percent >= PRICE_DROP_THRESHOLD_PERCENT) {
        const alert = this.createOnce({
          listing_id: listing.id,
          type: 'price_drop',
          severity: 'medium',
          title: 'Prix en baisse',
          message: `${listing.title} baisse de ${amount} € (${percent}%).`,
          score,
          metadata: {
            previous_price: previousPrice,
            current_price: currentPrice,
            price_drop_amount: amount,
            price_drop_percent: percent,
            history,
          },
        });
        if (alert) created.push(alert);
      }
    }

    return created;
  }

  createOnce(alert) {
    const now = new Date().toISOString();
    const metadata = alert.metadata ? JSON.stringify(alert.metadata) : null;

    run(`
      INSERT OR IGNORE INTO listing_alerts (
        listing_id, type, severity, title, message, score, created_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      alert.listing_id,
      alert.type,
      alert.severity,
      alert.title,
      alert.message,
      alert.score ?? null,
      now,
      metadata,
    ]);

    return get(
      'SELECT * FROM listing_alerts WHERE listing_id = ? AND type = ? ORDER BY datetime(created_at) DESC, id DESC LIMIT 1',
      [alert.listing_id, alert.type]
    );
  }

  findRecent(filters = {}) {
    let query = 'SELECT * FROM listing_alerts WHERE 1=1';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.unreadOnly) {
      query += ' AND read_at IS NULL';
    }

    query += ' ORDER BY datetime(created_at) DESC, id DESC LIMIT ?';
    params.push(filters.limit || 20);

    return all(query, params).map(alert => ({
      ...alert,
      metadata: parseMetadata(alert.metadata),
    }));
  }

  getSummary() {
    const unread = get('SELECT COUNT(*) as count FROM listing_alerts WHERE read_at IS NULL');
    const highScore = get('SELECT COUNT(*) as count FROM listing_alerts WHERE type = ?', ['high_score']);
    const priceDrop = get('SELECT COUNT(*) as count FROM listing_alerts WHERE type = ?', ['price_drop']);

    return {
      unread: unread?.count || 0,
      high_score: highScore?.count || 0,
      price_drop: priceDrop?.count || 0,
    };
  }
}

function parseMetadata(metadata) {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
}
