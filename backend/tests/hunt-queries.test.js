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

  test('uses high-precision Jungle queries and avoids noisy generic Pikachu query', () => {
    const queries = buildHuntQueries({ profile: 'wizards-fr', filters: { series: 'jungle' } });

    expect(queries).toEqual(expect.arrayContaining([
      'pokemon jungle',
      'carte pokemon jungle',
      'jungle 64 pokemon',
      'scarabrute jungle',
      'insecateur jungle',
      'aquali jungle',
    ]));
    expect(queries).not.toContain('pikachu jungle');
    expect(queries.every(query => /jungle|64/i.test(query))).toBe(true);
  });

  test('adds lot intent to targeted Jungle queries when lot listing type is selected', () => {
    const queries = buildHuntQueries({ profile: 'wizards-fr', filters: { series: 'jungle', listingType: 'lot' } });

    expect(queries).toEqual(expect.arrayContaining([
      'lot pokemon jungle',
      'lot carte pokemon jungle',
      'lot pokemon jungle 64',
      'lot pokemon scarabrute jungle',
    ]));
    expect(queries.every(query => /\b(lot|collection|classeur|vrac|set|extension|cartes?)\b/i.test(query))).toBe(true);
    expect(queries.every(query => /\b(pokemon|pokémon|carte|cartes|wizards?|wotc|jungle|fossile|fossil|rocket|base|obscur|sombre|dark|holo|rare|set|extension|collection|classeur)\b|\/(82|64|62|102)\b/i.test(query))).toBe(true);
  });

  test('uses the requested Team Rocket lot query playbook in priority order without budget keywords', () => {
    const queries = buildHuntQueries({ profile: 'wizards-fr', filters: { series: 'rocket', listingType: 'lot', budget: 800 } });

    expect(queries.slice(0, 23)).toEqual([
      'lot pokemon team rocket',
      'lot pokémon team rocket',
      'lot cartes pokemon team rocket',
      'lot cartes pokémon team rocket',
      'cartes team rocket fr',
      'lot pokemon team rocket français',
      'lot pokemon dracaufeu obscur',
      'lot pokemon dark charizard',
      'lot pokemon tortank obscur',
      'lot pokemon dark blastoise',
      'lot pokemon raichu obscur',
      'lot pokemon dark raichu',
      'lot pokemon dracolosse obscur',
      'lot pokemon dark dragonite',
      'lot pokemon wizards',
      'lot pokémon wizards',
      'lot cartes pokemon anciennes',
      'lot cartes pokémon anciennes',
      'classeur cartes pokemon ancien',
      'cartes pokemon de mon enfance',
      'collection pokemon ancienne',
      'cartes pokemon team rocket',
      'cartes pokémon team rocket',
    ]);
    expect(queries).toEqual(expect.arrayContaining([
      'collection pokemon team rocket',
      'lot team rocket français',
      'cartes pokemon années 2000',
      'lot pokemon dracofeu obscur',
      'cartes pokemon sombres',
      'lot pokemon holo team rocket',
      'lot pokemon 1ère édition team rocket',
    ]));
    expect(queries.some(query => /800|budget|prix/i.test(query))).toBe(false);
    expect(queries.some(query => /^(dracaufeu|dark charizard|tortank|dark blastoise|raichu|dark raichu|dracolosse|dark dragonite)\b/i.test(query))).toBe(false);
    expect(queries.every(query => /\b(lot|collection|classeur|cartes|vrac|gros lot)\b/i.test(query))).toBe(true);
    expect(queries.some(query => /^lot dracolosse obscur$/i.test(query))).toBe(false);
    expect(queries.length).toBeGreaterThanOrEqual(70);
  });

  test('keeps Pokemon/card domain for every lot query across existing series to avoid Vinted clothing lots', () => {
    for (const series of ['all', 'base', 'jungle', 'fossil', 'rocket']) {
      const queries = buildHuntQueries({ profile: 'wizards-fr', filters: { series, listingType: 'lot' } });
      expect(queries.length).toBeGreaterThanOrEqual(12);
      expect(queries.every(query => /\b(pokemon|pokémon|carte|cartes|wizards?|wotc|jungle|fossile|fossil|rocket|base|obscur|sombre|dark|holo|rare|set|extension|collection|classeur)\b|\/(82|64|62|102)\b/i.test(query))).toBe(true);
    }
  });

  test('builds card-search queries for every existing series without lot intent', () => {
    for (const series of ['all', 'base', 'jungle', 'fossil', 'rocket']) {
      const queries = buildHuntQueries({ profile: 'wizards-fr', filters: { series, listingType: 'cards' } });
      expect(queries.length).toBeGreaterThanOrEqual(10);
      expect(queries.every(query => /\b(pokemon|pokémon|carte|cartes|wizards?|wotc|jungle|fossile|fossil|rocket|base|obscur|sombre|dark|holo|rare)\b|\/(82|64|62|102)\b/i.test(query))).toBe(true);
      expect(queries.filter(query => /^lot\b/i.test(query))).toEqual([]);
    }
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
