import { describe, test, expect } from '@jest/globals';
import { filterByBudget } from '../src/services/hunt-filters.js';

describe('Hunt filters', () => {
  test('keeps listings at or under configured max budget', () => {
    const listings = [
      { title: 'Carte 10 euros', price: 10 },
      { title: 'Carte 15 euros', price: 15 },
      { title: 'Carte 16 euros', price: 16 },
      { title: 'Prix inconnu', price: 0 },
    ];

    const result = filterByBudget(listings, 15);

    expect(result.kept.map(item => item.title)).toEqual(['Carte 10 euros', 'Carte 15 euros', 'Prix inconnu']);
    expect(result.rejected.map(item => item.title)).toEqual(['Carte 16 euros']);
  });

  test('does not filter when budget is missing or invalid', () => {
    const listings = [{ title: 'Carte 100 euros', price: 100 }];

    const result = filterByBudget(listings, undefined);

    expect(result.kept).toHaveLength(1);
    expect(result.rejected).toHaveLength(0);
  });
});
