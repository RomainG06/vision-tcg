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

  test('keeps only listings inside configured price range while preserving unknown prices', () => {
    const listings = [
      { title: 'Trop bas', price: 5 },
      { title: 'Dans la fourchette basse', price: 50 },
      { title: 'Dans la fourchette haute', price: 120 },
      { title: 'Trop haut', price: 160 },
      { title: 'Prix inconnu', price: 0 },
    ];

    const result = filterByBudget(listings, { min: 50, max: 120 });

    expect(result.kept.map(item => item.title)).toEqual(['Dans la fourchette basse', 'Dans la fourchette haute', 'Prix inconnu']);
    expect(result.rejected.map(item => item.title)).toEqual(['Trop bas', 'Trop haut']);
  });

  test('does not filter when budget is missing or invalid', () => {
    const listings = [{ title: 'Carte 100 euros', price: 100 }];

    const result = filterByBudget(listings, undefined);

    expect(result.kept).toHaveLength(1);
    expect(result.rejected).toHaveLength(0);
  });
});
