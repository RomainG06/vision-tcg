import { describe, test, expect } from '@jest/globals';
import { explainListingScore } from '../src/scoring/scorer-simple.js';
import { classifyListingQuality } from '../src/services/listing-quality.js';

const rocketOptions = {
  targetSeries: 'rocket',
  minScore: 50,
  allowBorderlineTargets: true,
  candidateScoreFloor: 20,
  budgetMax: 1500,
};

describe('Explainable radar scoring', () => {
  test('explains why Team Rocket singles are actionable candidates', () => {
    const listing = {
      title: 'Carte Pokémon Kadabra obscur 39/82 1st - Wizards Team Rocket 2001',
      description: 'Langue Français - carte authentique',
      price: 9.8,
      distance_km: null,
    };

    const scored = explainListingScore(listing);
    const quality = classifyListingQuality(scored, rocketOptions);

    expect(scored.score).toBeGreaterThanOrEqual(20);
    expect(scored.score_breakdown.subscores.series.points).toBeGreaterThan(0);
    expect(scored.score_breakdown.subscores.language.points).toBeGreaterThan(0);
    expect(scored.score_breakdown.subscores.lot.points).toBe(0);
    expect(scored.score_breakdown.explanation).toContain('Team Rocket');
    expect(quality.keep).toBe(true);
    expect(['candidate_ok', 'borderline_target_candidate']).toContain(quality.reason);
    expect(['good_candidate', 'strong_opportunity']).toContain(quality.quality_tier);
  });

  test('does not classify Neo Destiny obscure cards as Team Rocket targets', () => {
    const listing = {
      title: 'Carte Pokémon Feurisson obscur 39/105 - Wizards Neo Destiny 2002',
      description: 'Langue Français',
      price: 7.9,
    };

    const scored = explainListingScore(listing);
    const quality = classifyListingQuality(scored, rocketOptions);

    expect(scored.score_breakdown.series_detected).toContain('neo');
    expect(quality.keep).toBe(false);
    expect(quality.reason).toBe('series_mismatch');
    expect(quality.risk_reasons).toContain('Série ciblée non détectée');
  });

  test('explains budget rejection separately from score quality', () => {
    const listing = {
      title: 'Carte Pokémon Rafflesia obscur 13/82 - Wizards Team Rocket 2001',
      description: 'Langue Français',
      price: 164.5,
    };

    const scored = explainListingScore(listing);
    const quality = classifyListingQuality(scored, { ...rocketOptions, budgetMax: 150 });

    expect(scored.score).toBeGreaterThanOrEqual(20);
    expect(quality.keep).toBe(false);
    expect(quality.reason).toBe('over_budget');
    expect(quality.quality_tier).toBe('rejected_budget');
    expect(quality.risk_reasons).toContain('Prix au-dessus du budget');
  });
});
