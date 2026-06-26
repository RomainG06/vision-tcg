import { get, run } from '../db/database.js';

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export class PriceInfoCacheRepository {
  get(provider, cacheKey, now = new Date()) {
    const row = get(
      `SELECT provider, cache_key, payload, created_at, updated_at, expires_at
       FROM price_info_cache
       WHERE provider = ? AND cache_key = ? AND expires_at > ?`,
      [provider, cacheKey, now.toISOString()]
    );

    if (!row) return null;
    return {
      provider: row.provider,
      cache_key: row.cache_key,
      created_at: row.created_at,
      updated_at: row.updated_at,
      expires_at: row.expires_at,
      payload: safeJsonParse(row.payload),
    };
  }

  set(provider, cacheKey, payload, ttlHours = 48, now = new Date()) {
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + Math.max(1, Number(ttlHours || 48)) * 60 * 60 * 1000).toISOString();
    const jsonPayload = JSON.stringify(payload);

    run(
      `INSERT INTO price_info_cache (provider, cache_key, payload, created_at, updated_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider, cache_key) DO UPDATE SET
         payload = excluded.payload,
         updated_at = excluded.updated_at,
         expires_at = excluded.expires_at`,
      [provider, cacheKey, jsonPayload, createdAt, createdAt, expiresAt]
    );

    return {
      provider,
      cache_key: cacheKey,
      payload,
      created_at: createdAt,
      updated_at: createdAt,
      expires_at: expiresAt,
    };
  }
}

export const priceInfoCacheRepository = new PriceInfoCacheRepository();
