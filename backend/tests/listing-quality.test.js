import { describe, test, expect } from '@jest/globals';
import { evaluateListingQuality, filterQualityListings, isLotListingText, selectExplorationCandidates, splitQualityListings, classifyListingQuality } from '../src/services/listing-quality.js';

describe('Listing quality filter', () => {
  test('classifies kept listings into decision tiers with human explanations', () => {
    const strong = classifyListingQuality({
      title: 'Lot 100 cartes Pokemon Wizards Team Rocket françaises holo',
      description: 'Collection ancienne FR, plusieurs rares',
      price: 80,
      score: 82,
    }, { minScore: 50 });

    expect(strong.quality_tier).toBe('strong_opportunity');
    expect(strong.action_suggestion).toBe('contacter_rapidement');
    expect(strong.positive_reasons).toEqual(expect.arrayContaining([
      'Série Wizards / ancienne détectée',
      'Langue française probable',
      'Lot ou collection détecté',
    ]));

    const review = classifyListingQuality({
      title: 'Carte Pokemon holo bon état',
      description: 'Photo disponible',
      price: 12,
      score: 10,
    }, { allowExplorationFallback: true });

    expect(review.quality_tier).toBe('manual_review');
    expect(review.keep).toBe(true);
    expect(review.action_suggestion).toBe('verifier_manuellement');
    expect(review.risk_reasons).toContain('Signal Wizards/FR insuffisant');
  });

  test('classifies noisy and budget rejected listings with explicit tiers', () => {
    const noisy = classifyListingQuality({
      title: 'Lot Pokemon japonais fake proxy',
      description: 'Japanese custom cards',
      price: 20,
      score: 70,
    });
    expect(noisy.keep).toBe(false);
    expect(noisy.quality_tier).toBe('rejected_noise');
    expect(noisy.action_suggestion).toBe('ignorer');

    const budget = classifyListingQuality({
      title: 'Lot Wizards FR',
      description: 'Cartes françaises',
      price: 600,
      score: 75,
    }, { budgetMax: 500 });
    expect(budget.keep).toBe(false);
    expect(budget.quality_tier).toBe('rejected_budget');
    expect(budget.risk_reasons).toContain('Prix au-dessus du budget');
  });

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

  test('keeps French card listings mentioning shipping protection and noisy hashtags', () => {
    const listing = {
      title: 'Dracolosse Obscur Edition 1 22/82',
      description: `Série : Team Rocket Edition 1
Numéro : 22/82
Rareté : Rare
État : Used (Pliures)
Langue : Français 🇫🇷
Carte 100% authentique
Protection rigide (Top Loader) – envoi rapide et soigné.
D'autres cartes disponibles dans mon dressing : WIZARD, EX, DP, PLATINE, HGSS, NOIR & BLANC, XY, SL, EB, EV...
#pokemon #cartepokemon #japonaise #rare #holo #wizard #dracaufeu`,
      price: 35,
      score: 62,
    };

    const quality = evaluateListingQuality(listing, { minScore: 50 });

    expect(quality.keep).toBe(true);
    expect(quality.signals).toEqual(expect.arrayContaining(['wizards_detected', 'french_edition']));
    expect(quality.noise).not.toContain('foreign_language_detected');
    expect(quality.noise).not.toContain('accessory_detected');
  });

  test('keeps authentic Team Rocket single cards even when they are not lots', () => {
    const listings = [
      {
        title: 'Carte Pokémon Rafflesia obscur 13/82 - Wizards Team Rocket 2001',
        description: 'Langue Français - état excellent',
        price: 164.5,
        score: 45,
      },
      {
        title: 'Carte Pokémon Kadabra obscur 39/82 1st - Wizards Team Rocket 2001',
        description: 'Edition 1 - Français',
        price: 9.8,
        score: 38,
      },
      {
        title: 'Carte Pokémon Alakazam obscur 18/82 - Wizards Team Rocket 2001',
        description: 'Carte originale française',
        price: 16.5,
        score: 42,
      },
    ];

    const result = splitQualityListings(listings, {
      minScore: 50,
      targetSeries: 'rocket',
      allowBorderlineTargets: true,
      candidateScoreFloor: 20,
    });

    expect(result.kept.map(item => item.title)).toEqual(listings.map(item => item.title));
    expect(result.rejected).toHaveLength(0);
    expect(result.kept.every(item => item.quality.reason === 'borderline_target_candidate')).toBe(true);
  });

  test('requires explicit Team Rocket signal when rocket series is targeted', () => {
    const result = splitQualityListings([
      {
        title: 'Lot cartes Pokemon Jungle Wizards françaises',
        description: 'Collection ancienne FR avec plusieurs holos Jungle',
        price: 85,
        score: 82,
      },
      {
        title: 'Dracolosse Obscur Edition 1 22/82',
        description: 'Série : Team Rocket Edition 1 - Langue : Français',
        price: 35,
        score: 62,
      },
    ], { minScore: 50, targetSeries: 'rocket', rejectedLimit: 5 });

    expect(result.kept.map(item => item.title)).toEqual(['Dracolosse Obscur Edition 1 22/82']);
    expect(result.rejected[0]).toMatchObject({
      title: 'Lot cartes Pokemon Jungle Wizards françaises',
      rejection_reason: 'series_mismatch',
    });
    expect(result.rejected[0].risks).toContain('series_mismatch');
  });

  test('requires explicit Jungle signal when jungle series is targeted', () => {
    const rocketQuality = classifyListingQuality({
      title: 'Dracolosse Obscur Edition 1 22/82',
      description: 'Série : Team Rocket Edition 1 - Langue : Français',
      price: 35,
      score: 62,
    }, { minScore: 50, targetSeries: 'jungle' });

    expect(rocketQuality.keep).toBe(false);
    expect(rocketQuality.reason).toBe('series_mismatch');
    expect(rocketQuality.quality_tier).toBe('rejected_series_mismatch');
    expect(rocketQuality.risk_reasons).toContain('Série ciblée non détectée');
  });

  test('rejects Italian modern Pikachu cards during a Jungle hunt', () => {
    const result = splitQualityListings([
      {
        title: 'Carta pokemon Pikachu 55/236 reverse sintonia mentale Sokuna ita',
        description: 'Carta italiana near mint',
        price: 9.9,
        score: 78,
      },
      {
        title: 'Carta Pikachu Holo stamped Pokemon GO 028/078 ita',
        description: 'Near mint italiano',
        price: 3.9,
        score: 78,
      },
      {
        title: 'Scarabrute 9/64 Jungle holo français',
        description: 'Carte Pokémon Wizards Jungle - Langue Français',
        price: 45,
        score: 62,
      },
    ], {
      minScore: 50,
      targetSeries: 'jungle',
      rejectedLimit: 10,
    });

    expect(result.kept.map(item => item.title)).toEqual(['Scarabrute 9/64 Jungle holo français']);
    expect(result.rejected).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Carta pokemon Pikachu 55/236 reverse sintonia mentale Sokuna ita' }),
      expect.objectContaining({ title: 'Carta Pikachu Holo stamped Pokemon GO 028/078 ita' }),
    ]));
    expect(result.rejected.map(item => item.rejection_reason)).toEqual(expect.arrayContaining(['series_mismatch']));
    expect(result.rejected.flatMap(item => item.risks || [])).toContain('foreign_language_detected');
  });

  test('rejects Diamant & Perle cards during a Jungle hunt even when they are French and cheap', () => {
    const result = splitQualityListings([
      {
        title: 'Carte Pokémon Simiabraz 5/130 Reverse Rare DP01 Set Diamant & Perle FR',
        description: 'Carte française pas chère',
        price: 5,
        score: 78,
      },
      {
        title: 'Carte Pokémon Abra 69/123 Commune DP02 Diamant & Perle Set Trésors Mystérieux FR',
        description: 'Carte française pas chère',
        price: 2,
        score: 78,
      },
      {
        title: 'Ronflex 11/64 Jungle holo français',
        description: 'Carte Pokémon Wizards Jungle - Langue Français',
        price: 55,
        score: 62,
      },
    ], {
      minScore: 50,
      targetSeries: 'jungle',
      rejectedLimit: 10,
    });

    expect(result.kept.map(item => item.title)).toEqual(['Ronflex 11/64 Jungle holo français']);
    expect(result.rejected).toHaveLength(2);
    expect(result.rejected.map(item => item.rejection_reason)).toEqual(expect.arrayContaining(['series_mismatch']));
    expect(result.rejected.flatMap(item => item.risks || [])).toContain('modern_detected');
  });

  test('strictly keeps only Jungle lots within budget when lot listing type is selected', () => {
    const result = splitQualityListings([
      {
        title: 'Ronflex 11/64 Jungle holo français',
        description: 'Carte Pokémon Wizards Jungle - Langue Français - carte seule',
        price: 55,
        score: 70,
      },
      {
        title: 'Lot 24 cartes Pokémon Jungle Wizards FR avec Scarabrute 9/64',
        description: 'Collection française Jungle, plusieurs cartes, bon état',
        price: 120,
        score: 76,
      },
      {
        title: 'Lot 50 cartes Pokémon Diamant & Perle FR',
        description: 'DP01 et DP02, cartes françaises',
        price: 40,
        score: 80,
      },
      {
        title: 'Lot 100 cartes Pokémon Jungle Wizards FR',
        description: 'Collection française Jungle',
        price: 350,
        score: 80,
      },
    ], {
      minScore: 50,
      targetSeries: 'jungle',
      listingType: 'lot',
      budgetMax: 300,
      rejectedLimit: 10,
    });

    expect(result.kept.map(item => item.title)).toEqual(['Lot 24 cartes Pokémon Jungle Wizards FR avec Scarabrute 9/64']);
    expect(result.rejected).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'Ronflex 11/64 Jungle holo français', rejection_reason: 'listing_type_mismatch' }),
      expect.objectContaining({ title: 'Lot 50 cartes Pokémon Diamant & Perle FR', rejection_reason: 'series_mismatch' }),
      expect.objectContaining({ title: 'Lot 100 cartes Pokémon Jungle Wizards FR', rejection_reason: 'over_budget' }),
    ]));
    expect(result.rejected.flatMap(item => item.risks || [])).toEqual(expect.arrayContaining([
      'listing_type_mismatch',
      'series_mismatch',
      'over_budget',
    ]));
  });

  test('does not use exploration fallback for off-series candidates', () => {
    const candidates = selectExplorationCandidates([
      { title: 'Carte Pokemon holo bon état', description: 'Photo disponible', price: 12, score: 70, score_breakdown: { signals: [] } },
      { title: 'Lot Team Rocket cartes Pokemon', description: 'Rocket obscur wizard', price: 40, score: 30, score_breakdown: { signals: [] } },
    ], { limit: 2, targetSeries: 'rocket' });

    expect(candidates.map(item => item.title)).toEqual(['Lot Team Rocket cartes Pokemon']);
  });

  test('selects exploration candidates when strict quality keeps nothing', () => {
    const listings = [
      { title: 'Carte Pokemon holo bon état', description: 'Photo disponible', price: 12, score: 10, score_breakdown: { signals: [] } },
      { title: 'Sleeves Pokemon neuves', description: 'Accessoires', price: 5, score: 10, score_breakdown: { signals: [] } },
      { title: 'Carte Pokemon ancienne', description: 'À voir', price: 8, score: 8, score_breakdown: { signals: [] } },
    ];

    const candidates = selectExplorationCandidates(listings, { limit: 2 });

    expect(candidates.map(item => item.title)).toEqual(['Carte Pokemon holo bon état', 'Carte Pokemon ancienne']);
    expect(candidates[0].quality.reason).toBe('exploration_fallback_candidate');
    expect(candidates[0].score_breakdown.risks).toContain('manual_review_needed');
  });

  test('splitQualityListings exposes rejected samples with reasons for scan debug', () => {
    const listings = [
      { title: 'Lot Wizards FR Jungle', description: '50 cartes françaises', price: 90, score: 75, score_breakdown: { signals: [] } },
      { title: 'Carte Pokemon japonaise', description: 'Japanese only', price: 15, score: 70, score_breakdown: { signals: [] } },
      { title: 'Booster moderne Pokemon', description: 'Écarlate Violet', price: 8, score: 65, score_breakdown: { signals: [] } },
    ];

    const result = splitQualityListings(listings, { minScore: 50, rejectedLimit: 2 });

    expect(result.kept).toHaveLength(1);
    expect(result.rejected).toHaveLength(2);
    expect(result.rejected[0]).toMatchObject({
      title: 'Carte Pokemon japonaise',
      rejection_reason: 'noise_detected',
    });
    expect(result.rejected[0].risks).toContain('foreign_language_detected');
    expect(result.rejected[1].risks).toContain('modern_detected');
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
