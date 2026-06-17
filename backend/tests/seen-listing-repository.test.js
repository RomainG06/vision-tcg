import { describe, test, expect, beforeAll } from '@jest/globals';
import { initDatabase } from '../src/db/database.js';
import { SeenListingRepository } from '../src/repositories/seen-listing-repository.js';

describe('SeenListingRepository', () => {
  let repo;

  beforeAll(async () => {
    await initDatabase();
    repo = new SeenListingRepository();
  });

  test('records rejected listings and returns active excluded ids for the same target series', () => {
    repo.markSeen({
      source: 'vinted',
      external_id: 'rocket-rejected-1',
      url: 'https://www.vinted.fr/items/rocket-rejected-1',
      title: 'One Piece hors sujet',
      target_series: 'rocket',
      last_query: 'carte pokemon team rocket',
      last_decision: 'rejected',
      last_rejection_reason: 'series_mismatch',
      skip_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    expect(repo.findExcludedExternalIdsBySource('vinted', { targetSeries: 'rocket' }))
      .toContain('rocket-rejected-1');
  });

  test('does not exclude expired seen listings', () => {
    repo.markSeen({
      source: 'vinted',
      external_id: 'expired-1',
      url: 'https://www.vinted.fr/items/expired-1',
      title: 'Expired',
      target_series: 'rocket',
      last_decision: 'rejected',
      last_rejection_reason: 'low_score',
      skip_until: new Date(Date.now() - 60 * 1000).toISOString(),
    });

    expect(repo.findExcludedExternalIdsBySource('vinted', { targetSeries: 'rocket' }))
      .not.toContain('expired-1');
  });
});
