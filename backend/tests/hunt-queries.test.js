import { describe, test, expect } from '@jest/globals';
import { buildHuntQueries, dedupeListingsBySourceExternalId } from '../src/services/hunt-queries.js';

describe('Smart hunt queries', () => {
  test('builds multiple targeted queries for Team Rocket hunts', () => {
    const queries = buildHuntQueries({ profile: 'wizards-fr', filters: { series: 'rocket' } });

    expect(queries.length).toBeGreaterThanOrEqual(6);
    expect(queries).toEqual(expect.arrayContaining([
      'pokemon team rocket',
      'carte pokemon team rocket',
      'team rocket edition 1',
      'dracolosse obscur',
      'dracaufeu obscur',
      'wizards team rocket',
    ]));
    expect(new Set(queries).size).toBe(queries.length);
  });

  test('keeps broad Wizards FR fallback queries for all-series hunts', () => {
    const queries = buildHuntQueries({ filters: { series: 'all' } });

    expect(queries).toEqual(expect.arrayContaining([
      'pokemon cartes wizards francais lot',
      'carte pokemon ancienne',
      'lot pokemon ancien',
      'pokemon wizard francais',
    ]));
  });

  test('deduplicates listings by source and external id while preserving query matches', () => {
    const listings = [
      { source: 'vinted', external_id: '1', title: 'Dracolosse Obscur', query: 'team rocket' },
      { source: 'vinted', external_id: '1', title: 'Dracolosse Obscur duplicate', query: 'dracolosse obscur' },
      { source: 'vinted', external_id: '2', title: 'Raichu Obscur', query: 'team rocket' },
      { source: 'leboncoin', external_id: '1', title: 'Same id other source', query: 'team rocket' },
    ];

    const result = dedupeListingsBySourceExternalId(listings);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ source: 'vinted', external_id: '1', title: 'Dracolosse Obscur' });
    expect(result[0].matched_queries).toEqual(['team rocket', 'dracolosse obscur']);
    expect(result.map(item => `${item.source}:${item.external_id}`)).toEqual(['vinted:1', 'vinted:2', 'leboncoin:1']);
  });
});
