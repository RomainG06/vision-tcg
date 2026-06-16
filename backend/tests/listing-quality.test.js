import { describe, test, expect } from '@jest/globals';
import { evaluateListingQuality, filterQualityListings, isLotListingText } from '../src/services/listing-quality.js';

describe('Listing quality filter', () => {
  test('keeps a strong Wizards French lot', () => {
    const listing = {
      title: 'Lot 100 cartes Pokemon Wizards Jungle Fossile françaises',
      description: 'Cartes années 90, plusieurs holos, édition française',
      price: 120,
      score: 78,
    };

    const quality = evaluateListingQuality(listing, { minScore: 50 });

    expect(quality.keep).toBe(true);
    expect(quality.signals).toEqual(expect.arrayContaining(['wizards_detected', 'french_edition', 'lot_detected']));
    expect(quality.noise).toHaveLength(0);
  });

  test('rejects modern accessories even when Pokemon is present', () => {
    const listing = {
      title: 'Classeur Pokemon moderne avec sleeves et accessoires',
      description: 'Pas de cartes Wizards, uniquement accessoires et rangement',
      price: 20,
      score: 62,
    };

    const quality = evaluateListingQuality(listing, { minScore: 50 });

    expect(quality.keep).toBe(false);
    expect(quality.noise).toEqual(expect.arrayContaining(['modern_detected', 'accessory_detected']));
  });

  test('rejects Japanese-only listings for Wizards FR hunt', () => {
    const listing = {
      title: 'Lot cartes Pokemon japonaises vintage holo',
      description: 'Japanese cards only, no French cards',
      price: 80,
      score: 70,
    };

    const quality = evaluateListingQuality(listing, { minScore: 50 });

    expect(quality.keep).toBe(false);
    expect(quality.noise).toEqual(expect.arrayContaining(['foreign_language_detected']));
  });

  test('does not tag obvious single-card listings as lots', () => {
    expect(isLotListingText('Dracaufeu set de base holo FR carte seule')).toBe(false);
    expect(isLotListingText('Carte unique Mewtwo Wizards français')).toBe(false);

    const quality = evaluateListingQuality({
      title: 'Dracaufeu set de base holo FR carte seule',
      description: 'Wizards français, vendu à l’unité',
      price: 250,
      score: 82,
    });

    expect(quality.signals).not.toContain('lot_detected');
  });

  test('keeps target-era budget candidates even when Vinted text is sparse', () => {
    const listing = {
      title: 'Carte Pokémon Jungle holo',
      description: 'Bon état',
      price: 20,
      score: 20,
    };

    const quality = evaluateListingQuality(listing, {
      minScore: 50,
      allowBorderlineTargets: true,
      candidateScoreFloor: 20,
    });

    expect(quality.keep).toBe(true);
    expect(quality.reason).toBe('borderline_target_candidate');
    expect(quality.signals).toContain('wizards_detected');
  });

  test('filterQualityListings keeps only actionable candidates and annotates score_breakdown', () => {
    const listings = [
      { title: 'Lot Wizards FR Jungle', description: '50 cartes françaises', price: 90, score: 75, score_breakdown: { signals: [] } },
      { title: 'Booster display moderne Pokemon', description: 'Écarlate Violet neuf', price: 110, score: 65, score_breakdown: { signals: [] } },
      { title: 'Random jouet Pokemon', description: 'Figurine plastique', price: 10, score: 20, score_breakdown: { signals: [] } },
    ];

    const filtered = filterQualityListings(listings, { minScore: 50 });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toContain('Wizards');
    expect(filtered[0].score_breakdown.signals).toContain('wizards_detected');
    expect(filtered[0].score_breakdown.quality.keep).toBe(true);
  });
});
