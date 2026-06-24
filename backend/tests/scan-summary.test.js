import { buildActionableScanSummary } from '../src/services/scan-summary.js';

describe('buildActionableScanSummary', () => {
  it('builds counts, funnel and top rejection reasons', () => {
    const summary = buildActionableScanSummary({
      rawFound: 12,
      selectedForDetails: 8,
      fetchedDetails: 7,
      budgetFiltered: 2,
      qualityFiltered: 3,
      saved: 1,
      updated: 2,
      seenExcluded: 4,
      knownBeforeScan: 3,
      seenRecorded: 6,
      explorationFallback: 1,
      queryStats: [
        { source: 'vinted', query: 'pokemon team rocket', raw_found: 5, selected_for_details: 4, fetched_details: 3, cumulative_unique: 3, prefilter_summary: { selected: 4, non_pokemon_domain: 1 } },
        { source: 'vinted', query: 'dracaufeu obscur', raw_found: 7, selected_for_details: 4, fetched_details: 4, cumulative_unique: 7, error: 'blocked', prefilter_summary: { selected: 4, series_mismatch: 3 } },
      ],
      rejectedSamples: [
        { title: 'Carte moderne', rejection_reason: 'series_mismatch', price: 3 },
        { title: 'Lot trop cher', rejection_reason: 'over_budget', price: 250 },
        { title: 'Proxy', rejection_reason: 'noise_detected', price: 10 },
        { title: 'Autre moderne', rejection_reason: 'series_mismatch', price: 4 },
      ],
      errors: [{ type: 'query_error' }],
    });

    expect(summary.funnel).toEqual({
      raw_found: 12,
      selected_for_details: 8,
      details_fetched: 7,
      after_budget: 5,
      kept_after_quality: 2,
      saved_or_updated: 3,
    });
    expect(summary.rejection_reasons).toEqual({
      series_mismatch: 2,
      over_budget: 1,
      noise_detected: 1,
    });
    expect(summary.query_performance[0]).toMatchObject({
      query: 'dracaufeu obscur',
      raw_found: 7,
      fetched_details: 4,
      error: 'blocked',
      prefilter_summary: { selected: 4, series_mismatch: 3 },
    });
    expect(summary.headline).toContain('3 piste');
    expect(summary.alerts).toContain('1 requête en erreur');
  });

  it('suggests rescanning seen listings when memory hides all candidates', () => {
    const summary = buildActionableScanSummary({ rawFound: 0, seenExcluded: 113 });

    expect(summary.headline).toBe('0 piste exploitable');
    expect(summary.alerts).toContain('113 annonces déjà analysées ignorées');
    expect(summary.suggestions[0]).toContain('Ré-analyser les déjà vues');
  });

  it('keeps counts non-negative when inputs are partial', () => {
    const summary = buildActionableScanSummary({ rawFound: 1, budgetFiltered: 5, qualityFiltered: 5 });

    expect(summary.funnel.after_budget).toBe(0);
    expect(summary.funnel.kept_after_quality).toBe(0);
    expect(summary.headline).toBe('0 piste exploitable');
  });
});
