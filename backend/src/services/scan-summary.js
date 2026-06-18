function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampZero(value) {
  return Math.max(0, asNumber(value));
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count > 1 ? plural : singular}`;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item?.[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function sortEntriesDesc(entries) {
  return Object.fromEntries(
    Object.entries(entries).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  );
}

export function buildActionableScanSummary(input = {}) {
  const rawFound = clampZero(input.rawFound ?? input.raw_found);
  const budgetFiltered = clampZero(input.budgetFiltered ?? input.budget_filtered);
  const qualityFiltered = clampZero(input.qualityFiltered ?? input.quality_filtered);
  const selectedForDetails = clampZero(input.selectedForDetails ?? input.selected_for_details ?? rawFound);
  const fetchedDetails = clampZero(input.fetchedDetails ?? input.fetched_details ?? rawFound);
  const saved = clampZero(input.saved);
  const updated = clampZero(input.updated);
  const savedOrUpdated = saved + updated;
  const afterBudget = Math.max(0, fetchedDetails - budgetFiltered);
  const keptAfterQuality = Math.max(0, afterBudget - qualityFiltered);
  const queryStats = Array.isArray(input.queryStats ?? input.query_stats) ? (input.queryStats ?? input.query_stats) : [];
  const rejectedSamples = Array.isArray(input.rejectedSamples ?? input.rejected_samples) ? (input.rejectedSamples ?? input.rejected_samples) : [];
  const errors = Array.isArray(input.errors) ? input.errors : [];
  const queryErrors = queryStats.filter(query => query?.error).length || errors.filter(error => error?.type === 'query_error').length;
  const rejectionReasons = sortEntriesDesc(countBy(rejectedSamples, 'rejection_reason'));
  const queryPerformance = [...queryStats]
    .map(query => ({
      source: query.source,
      query: query.query,
      raw_found: clampZero(query.raw_found),
      selected_for_details: clampZero(query.selected_for_details ?? query.raw_found),
      fetched_details: clampZero(query.fetched_details ?? query.raw_found),
      cumulative_unique: clampZero(query.cumulative_unique),
      error: query.error || null,
    }))
    .sort((a, b) => b.raw_found - a.raw_found || b.fetched_details - a.fetched_details || a.query.localeCompare(b.query));

  const alerts = [];
  if (queryErrors > 0) alerts.push(`${pluralize(queryErrors, 'requête')} en erreur`);
  if (budgetFiltered > 0) alerts.push(`${pluralize(budgetFiltered, 'annonce')} hors budget`);
  if (qualityFiltered > 0) alerts.push(`${pluralize(qualityFiltered, 'annonce')} écartée${qualityFiltered > 1 ? 's' : ''} par qualité/série`);
  const seenExcluded = clampZero(input.seenExcluded ?? input.seen_excluded);
  if (seenExcluded > 0) alerts.push(`${pluralize(seenExcluded, 'annonce')} déjà analysée${seenExcluded > 1 ? 's' : ''} ignorée${seenExcluded > 1 ? 's' : ''}`);

  return {
    headline: `${pluralize(savedOrUpdated, 'piste')} exploitable${savedOrUpdated > 1 ? 's' : ''}`,
    funnel: {
      raw_found: rawFound,
      selected_for_details: selectedForDetails,
      details_fetched: fetchedDetails,
      after_budget: afterBudget,
      kept_after_quality: keptAfterQuality,
      saved_or_updated: savedOrUpdated,
    },
    counters: {
      saved,
      updated,
      known_before_scan: clampZero(input.knownBeforeScan ?? input.known_before_scan),
      seen_excluded: seenExcluded,
      seen_recorded: clampZero(input.seenRecorded ?? input.seen_recorded),
      exploration_fallback: clampZero(input.explorationFallback ?? input.exploration_fallback),
      errors: clampZero(input.errorsCount ?? input.errors_count ?? errors.length),
    },
    rejection_reasons: rejectionReasons,
    query_performance: queryPerformance,
    alerts,
  };
}
