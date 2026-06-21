import { fetchVinted } from '../fetchers/vinted.js';
import { fetchLeboncoin } from '../fetchers/leboncoin.js';
import { normalizeListings } from './normalizer.js';
import { explainListingScore } from '../scoring/scorer-simple.js';
import { ListingRepository } from '../repositories/listing-repository.js';
import { ScrapeRunRepository } from '../repositories/scrape-run-repository.js';
import { SeenListingRepository } from '../repositories/seen-listing-repository.js';
import { logger } from '../utils/logger.js';
import { selectExplorationCandidates, splitQualityListings } from './listing-quality.js';
import { filterByBudget } from './hunt-filters.js';
import { buildHuntQueries, buildPrimaryHuntQuery, dedupeListingsBySourceExternalId } from './hunt-queries.js';
import { buildActionableScanSummary } from './scan-summary.js';

const listingRepo = new ListingRepository();
const scrapeRunRepo = new ScrapeRunRepository();
const seenListingRepo = new SeenListingRepository();

const FETCHERS = {
  vinted: fetchVinted,
  leboncoin: fetchLeboncoin,
};

export function buildHuntQuery(options = {}) {
  return buildPrimaryHuntQuery(options);
}

export function buildSmartHuntQueries(options = {}) {
  return buildHuntQueries(options);
}

function scoreRawListing(rawListing) {
  const scored = explainListingScore(rawListing);
  const estimatedMin = Math.max(0, Math.round((rawListing.price || 0) * 1.15));
  const estimatedMax = Math.max(estimatedMin, Math.round((rawListing.price || 0) * 1.55));

  return {
    ...scored,
    score_breakdown: {
      ...scored.score_breakdown,
      confidence: Math.min(95, Math.max(45, scored.score + 10)),
      estimated_value_min: estimatedMin || null,
      estimated_value_max: estimatedMax || null,
      estimate_method: 'price_multiplier_fallback',
      estimate_confidence: 'low',
    },
  };
}

function getBudgetRange(filters = {}) {
  if (typeof filters.budget === 'object' && filters.budget !== null) {
    return {
      min: filters.budget.min ?? filters.budget.minPrice ?? filters.budget.min_price,
      max: filters.budget.max ?? filters.budget.maxPrice ?? filters.budget.max_price,
    };
  }
  return {
    min: filters.minBudget ?? filters.min_price ?? filters.minPrice,
    max: filters.budget ?? filters.maxBudget ?? filters.max_price ?? filters.maxPrice,
  };
}

function listingExternalId(listing) {
  return listing?.external_id || listing?.id || null;
}

function listingSeenKey(listing, source) {
  const externalId = listingExternalId(listing);
  return externalId ? `${listing.source || source}:${externalId}` : null;
}

function markSeenDecision(repo, listing, defaults) {
  const externalId = listingExternalId(listing);
  if (!externalId) return 0;

  repo.markSeen({
    source: listing.source || defaults.source,
    external_id: externalId,
    url: listing.url,
    title: listing.title,
    target_series: defaults.targetSeries,
    last_query: listing.query || listing.matched_query || defaults.query,
    last_decision: defaults.decision,
    last_rejection_reason: defaults.rejectionReason,
  });
  return 1;
}

function rotateQueries(queries = [], offset = 0) {
  if (!Array.isArray(queries) || queries.length <= 1) return Array.isArray(queries) ? [...queries] : [];
  const normalizedOffset = Math.abs(Number(offset) || 0) % queries.length;
  if (normalizedOffset === 0) return [...queries];
  return [...queries.slice(normalizedOffset), ...queries.slice(0, normalizedOffset)];
}

export async function startScrape(options = {}) {
  const {
    profile = 'wizards-fr',
    sources = ['vinted'],
    maxResults = 10,
    saveToDb = true,
    filters = {},
    waitForCaptcha = 60,
    smartQueries = true,
    maxQueries = filters.maxQueries || filters.max_queries,
    rescanSeen = filters.rescanSeen || filters.rescan_seen || false,
    allowSeenRescue = Boolean(filters.allowSeenRescue || filters.allow_seen_rescue || filters.seenRescue || filters.seen_rescue),
  } = options;

  const enabledSources = sources.filter(source => FETCHERS[source]);
  if (enabledSources.length === 0) {
    throw new Error('No supported source selected. Use vinted or leboncoin.');
  }

  const queries = smartQueries
    ? buildHuntQueries({ profile, filters, maxQueries })
    : [buildHuntQuery({ profile, filters })];
  const shouldRotateQueries = smartQueries && filters.rotateQueries !== false && filters.rotate_queries !== false;
  const queryRotationSeed = Number(filters.queryRotationSeed ?? filters.query_rotation_seed ?? Date.now());
  const queryRotationOffset = shouldRotateQueries && queries.length > 1
    ? Math.abs(queryRotationSeed) % queries.length
    : 0;
  const executionQueries = shouldRotateQueries
    ? rotateQueries(queries, queryRotationOffset)
    : [...queries];
  const query = executionQueries[0];
  const runId = scrapeRunRepo.create({
    source: enabledSources.join(','),
    query,
    status: 'running',
    metadata: JSON.stringify({ profile, filters, maxResults, queries: executionQueries, smartQueries, queryRotationOffset, queryRotationSeed }),
  });

  const startedAt = new Date().toISOString();
  const allListings = [];
  const errors = [];
  let saved = 0;
  let updated = 0;
  let rawFound = 0;
  let selectedForDetails = 0;
  let fetchedDetails = 0;
  let qualityFiltered = 0;
  let budgetFiltered = 0;
  let knownBeforeScan = 0;
  let seenExcluded = 0;
  let seenRecorded = 0;
  let explorationFallback = 0;
  const rejectedSamples = [];
  const queryStats = [];

  try {
    for (const source of enabledSources) {
      try {
        logger.info(`Starting smart scrape: ${source} queries=${executionQueries.length} maxResults=${maxResults}`);
        const savedExternalIds = saveToDb ? listingRepo.findExternalIdsBySource(source) : [];
        const seenExternalIds = saveToDb && !rescanSeen
          ? seenListingRepo.findExcludedExternalIdsBySource(source, { targetSeries: filters.series || 'all' })
          : [];
        const excludeExternalIds = [...new Set([...savedExternalIds, ...seenExternalIds].map(String))];
        knownBeforeScan += savedExternalIds.length;
        seenExcluded += seenExternalIds.length;
        const queryRawListings = [];
        const scanDepth = Math.max(maxResults * 8, 80);
        const perQueryLimit = Math.max(maxResults, Math.ceil(maxResults * 1.5));
        const dynamicExcludeIds = new Set(excludeExternalIds.map(String));
        const budgetRange = getBudgetRange(filters);

        for (const currentQuery of executionQueries) {
          const beforeCount = queryRawListings.length;
          try {
            const fetchedListings = await FETCHERS[source](currentQuery, {
              maxResults: perQueryLimit,
              scanDepth,
              excludeExternalIds: [...dynamicExcludeIds],
              targetSeries: filters.series || 'all',
              listingType: filters.listingType || filters.listing_type || 'cards',
              allowSeenRescue,
              budget: budgetRange,
              minPrice: budgetRange.min,
              maxPrice: budgetRange.max,
              waitForCaptcha,
            });
            const prefilterSummary = fetchedListings.prefilter_summary || null;
            const gridRawFound = Number(fetchedListings.grid_raw_found ?? prefilterSummary?.total ?? fetchedListings.length);
            const querySelectedForDetails = Number(fetchedListings.selected_for_details ?? prefilterSummary?.selected ?? fetchedListings.length);
            const taggedListings = fetchedListings.map(listing => ({
              ...listing,
              query: currentQuery,
              matched_query: currentQuery,
            }));
            queryRawListings.push(...taggedListings);
            const selectedExternalIds = Array.isArray(fetchedListings.selected_external_ids)
              ? fetchedListings.selected_external_ids
              : [];
            for (const id of selectedExternalIds) {
              if (id) dynamicExcludeIds.add(String(id));
            }
            for (const listing of fetchedListings) {
              const id = listing.external_id || listing.id;
              if (id) dynamicExcludeIds.add(String(id));
            }
            queryStats.push({
              source,
              query: currentQuery,
              raw_found: gridRawFound,
              selected_for_details: querySelectedForDetails,
              fetched_details: fetchedListings.length,
              prefilter_summary: prefilterSummary,
              cumulative_unique: dedupeListingsBySourceExternalId(queryRawListings).length,
              error: null,
            });
            rawFound += gridRawFound;
            selectedForDetails += querySelectedForDetails;
          } catch (error) {
            logger.error(`Scrape failed for ${source} query="${currentQuery}":`, error);
            queryStats.push({ source, query: currentQuery, raw_found: 0, selected_for_details: 0, fetched_details: 0, cumulative_unique: beforeCount, error: error.message });
            errors.push({ source, query: currentQuery, type: 'query_error', message: error.message });
          }
        }

        const rawListings = dedupeListingsBySourceExternalId(queryRawListings);
        const seenDecisions = new Map();

        fetchedDetails += rawListings.length;
        const budgetResult = filterByBudget(rawListings, budgetRange);
        if (budgetResult.rejected.length > 0) {
          budgetFiltered += budgetResult.rejected.length;
          for (const listing of budgetResult.rejected) {
            const key = listingSeenKey(listing, source);
            if (key) seenDecisions.set(key, { decision: 'rejected', rejectionReason: 'over_budget' });
          }
          rejectedSamples.push(...budgetResult.rejected.slice(0, Math.max(0, 20 - rejectedSamples.length)).map((listing) => ({
            title: listing.title || 'Annonce sans titre',
            price: listing.price ?? null,
            url: listing.url || null,
            source: listing.source || source,
            external_id: listing.external_id || listing.id || null,
            score: Number(listing.score || 0),
            rejection_reason: 'over_budget',
            signals: [],
            risks: ['over_budget'],
          })));
          errors.push({ source, type: 'budget_filtered', count: budgetResult.rejected.length, budget: budgetRange });
        }

        const scored = budgetResult.kept.map(scoreRawListing);
        const minScore = filters.minScore ?? filters.min_score ?? (filters.sensitivity === 'aggressive' ? 40 : filters.sensitivity === 'prudent' ? 60 : 50);
        const qualityResult = splitQualityListings(scored, {
          minScore,
          targetSeries: filters.series || 'all',
          listingType: filters.listingType || filters.listing_type || 'cards',
          allowBorderlineTargets: true,
          candidateScoreFloor: filters.sensitivity === 'prudent' ? 30 : 20,
          rejectedLimit: 20,
        });
        let qualityListings = qualityResult.kept;
        for (const rejected of qualityResult.rejected) {
          const key = listingSeenKey(rejected, source);
          if (key) seenDecisions.set(key, { decision: 'rejected', rejectionReason: rejected.rejection_reason || 'quality_filtered' });
        }
        rejectedSamples.push(...qualityResult.rejected.slice(0, Math.max(0, 20 - rejectedSamples.length)));
        if (qualityListings.length === 0 && scored.length > 0) {
          const fallbackLimit = Math.min(maxResults, filters.sensitivity === 'prudent' ? 3 : 5);
          qualityListings = selectExplorationCandidates(scored, {
            limit: fallbackLimit,
            minScore,
            targetSeries: filters.series || 'all',
            listingType: filters.listingType || filters.listing_type || 'cards',
            allowBorderlineTargets: true,
          });
          explorationFallback += qualityListings.length;
          if (qualityListings.length > 0) {
            errors.push({ source, type: 'exploration_fallback', count: qualityListings.length });
          }
        }
        const rejectedCount = scored.length - qualityListings.length;
        const keptKeys = new Set(qualityListings.map(listing => listingSeenKey(listing, source)).filter(Boolean));
        for (const listing of scored) {
          const key = listingSeenKey(listing, source);
          if (!key || seenDecisions.has(key) || keptKeys.has(key)) continue;
          seenDecisions.set(key, { decision: 'rejected', rejectionReason: listing.quality?.reason || 'quality_filtered' });
        }
        for (const listing of qualityListings) {
          const key = listingSeenKey(listing, source);
          if (key) seenDecisions.set(key, { decision: 'kept', rejectionReason: null });
        }
        if (rejectedCount > 0) {
          qualityFiltered += rejectedCount;
          errors.push({ source, type: 'quality_filtered', count: rejectedCount });
        }

        const { normalized, invalid } = normalizeListings(qualityListings, source, runId);

        if (invalid.length > 0) {
          for (const item of invalid) {
            const raw = item.listing || item.raw || item;
            const key = listingSeenKey(raw, source);
            if (key) seenDecisions.set(key, { decision: 'rejected', rejectionReason: 'invalid_listing' });
          }
          errors.push(...invalid.map(item => ({ source, type: 'invalid_listing', errors: item.errors })));
        }

        if (saveToDb) {
          for (const listing of rawListings) {
            const key = listingSeenKey(listing, source);
            const decision = key ? seenDecisions.get(key) : null;
            if (!decision) continue;
            seenRecorded += markSeenDecision(seenListingRepo, listing, {
              source,
              targetSeries: filters.series || 'all',
              query: listing.query || listing.matched_query || query,
              decision: decision.decision,
              rejectionReason: decision.rejectionReason,
            });
          }
        }

        for (const listing of normalized) {
          if (saveToDb) {
            const existed = listingRepo.findBySourceAndExternalId(listing.source, listing.external_id);
            listingRepo.upsert(listing);
            existed ? updated++ : saved++;
          }
          allListings.push(listing);
        }
      } catch (error) {
        logger.error(`Scrape failed for ${source}:`, error);
        errors.push({ source, type: 'source_error', message: error.message });
      }
    }

    const queryErrorCount = errors.filter(error => error.type === 'query_error').length;
    const totalQueryAttempts = enabledSources.length * executionQueries.length;
    const allQueriesFailed = totalQueryAttempts > 0 && queryErrorCount >= totalQueryAttempts;
    const status = allQueriesFailed ? 'failed' : 'completed';
    const actionableSummary = buildActionableScanSummary({
      rawFound,
      selectedForDetails,
      fetchedDetails,
      budgetFiltered,
      qualityFiltered,
      saved,
      updated,
      explorationFallback,
      knownBeforeScan,
      seenExcluded,
      seenRecorded,
      rejectedSamples,
      queryStats,
      errors,
    });

    scrapeRunRepo.update(runId, {
      status,
      results_count: allListings.length,
      errors_count: errors.length,
      metadata: JSON.stringify({ profile, filters, maxResults, queries: executionQueries, smartQueries, queryRotationOffset, queryRotationSeed, rescanSeen, saved, updated, selectedForDetails, fetchedDetails, budgetFiltered, qualityFiltered, explorationFallback, knownBeforeScan, seenExcluded, seenRecorded, rejectedSamples, queryStats, actionableSummary, errors }),
    });

    return {
      run_id: runId,
      status,
      query,
      queries: executionQueries,
      sources: enabledSources,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      listings: allListings,
      stats: {
        raw_found: rawFound,
        selected_for_details: selectedForDetails,
        fetched_details: fetchedDetails,
        queries_count: executionQueries.length,
        query_rotation_offset: queryRotationOffset,
        query_stats: queryStats,
        found: allListings.length,
        filtered: allListings.length,
        quality_filtered: qualityFiltered,
        budget_filtered: budgetFiltered,
        exploration_fallback: explorationFallback,
        rejected_samples_count: rejectedSamples.length,
        known_before_scan: knownBeforeScan,
        seen_excluded: seenExcluded,
        rescan_seen: Boolean(rescanSeen),
        seen_rescue_enabled: Boolean(allowSeenRescue),
        seen_recorded: seenRecorded,
        saved,
        updated,
        errors: errors.length,
      },
      query_stats: queryStats,
      rejected_samples: rejectedSamples,
      actionable_summary: actionableSummary,
      errors,
    };
  } catch (error) {
    scrapeRunRepo.fail(runId, error.message);
    throw error;
  }
}
