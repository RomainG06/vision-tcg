import { fetchVinted } from '../fetchers/vinted.js';
import { fetchLeboncoin } from '../fetchers/leboncoin.js';
import { normalizeListings } from './normalizer.js';
import { scoreListing } from '../scoring/scorer-simple.js';
import { ListingRepository } from '../repositories/listing-repository.js';
import { ScrapeRunRepository } from '../repositories/scrape-run-repository.js';
import { logger } from '../utils/logger.js';
import { filterQualityListings } from './listing-quality.js';
import { filterByBudget } from './hunt-filters.js';

const listingRepo = new ListingRepository();
const scrapeRunRepo = new ScrapeRunRepository();

const FETCHERS = {
  vinted: fetchVinted,
  leboncoin: fetchLeboncoin,
};

const SERIES_QUERY = {
  all: 'pokemon cartes wizards francais lot',
  base: 'pokemon set de base wizards francais',
  jungle: 'pokemon jungle wizards francais',
  fossil: 'pokemon fossile fossil wizards francais',
  rocket: 'pokemon team rocket wizards francais',
};

export function buildHuntQuery({ profile = 'wizards-fr', filters = {} } = {}) {
  const series = filters.series || 'all';
  const base = SERIES_QUERY[series] || SERIES_QUERY.all;
  return profile === 'wizards-fr' ? base : `${profile} ${base}`;
}

function buildScoreBreakdown(listing, score) {
  const text = `${listing.title || ''} ${listing.description || ''}`.toLowerCase();
  const signals = [];
  const risks = [];

  if (/wizards|wotc|base set|set de base|jungle|fossile|fossil|team rocket|gym/.test(text)) signals.push('wizards_detected');
  if (/français|francais|\bfr\b|vf/.test(text)) signals.push('french_edition');
  if (/lot|collection|cartes/.test(text)) signals.push('lot_detected');
  if (/holo|holographique|brillante/.test(text)) signals.push('holographic');
  if (/rare|dracaufeu|tortank|florizarre|mewtwo|ronflex/.test(text)) signals.push('rare_cards');
  if ((listing.price || 0) > 0 && (listing.price || 0) <= 100) signals.push('below_market');
  if (!listing.description || listing.description.length < 20) risks.push('description_short');
  if (!listing.location) risks.push('location_unknown');

  const estimatedMin = Math.max(0, Math.round((listing.price || 0) * 1.15));
  const estimatedMax = Math.max(estimatedMin, Math.round((listing.price || 0) * 1.55));

  return {
    confidence: Math.min(95, Math.max(45, score + 10)),
    estimated_value_min: estimatedMin || null,
    estimated_value_max: estimatedMax || null,
    signals: [...new Set(signals)],
    risks: [...new Set(risks)],
  };
}

function scoreRawListing(rawListing) {
  const score = scoreListing(rawListing);
  return {
    ...rawListing,
    score,
    score_breakdown: buildScoreBreakdown(rawListing, score),
  };
}

function getBudgetMax(filters = {}) {
  if (typeof filters.budget === 'object' && filters.budget !== null) {
    return filters.budget.max;
  }
  return filters.budget ?? filters.maxBudget ?? filters.max_price ?? filters.maxPrice;
}

export async function startScrape(options = {}) {
  const {
    profile = 'wizards-fr',
    sources = ['vinted'],
    maxResults = 10,
    saveToDb = true,
    filters = {},
    waitForCaptcha = 60,
  } = options;

  const enabledSources = sources.filter(source => FETCHERS[source]);
  if (enabledSources.length === 0) {
    throw new Error('No supported source selected. Use vinted or leboncoin.');
  }

  const query = buildHuntQuery({ profile, filters });
  const runId = scrapeRunRepo.create({
    source: enabledSources.join(','),
    query,
    status: 'running',
    metadata: JSON.stringify({ profile, filters, maxResults }),
  });

  const startedAt = new Date().toISOString();
  const allListings = [];
  const errors = [];
  let saved = 0;
  let updated = 0;
  let rawFound = 0;
  let qualityFiltered = 0;
  let budgetFiltered = 0;
  let knownBeforeScan = 0;

  try {
    for (const source of enabledSources) {
      try {
        logger.info(`Starting scrape: ${source} query="${query}" maxResults=${maxResults}`);
        const excludeExternalIds = saveToDb ? listingRepo.findExternalIdsBySource(source) : [];
        knownBeforeScan += excludeExternalIds.length;
        const rawListings = await FETCHERS[source](query, {
          maxResults,
          scanDepth: Math.max(maxResults * 8, 80),
          excludeExternalIds,
          waitForCaptcha,
          location: 'nice',
          radius: 50,
        });

        rawFound += rawListings.length;
        const budgetMax = getBudgetMax(filters);
        const budgetResult = filterByBudget(rawListings, budgetMax);
        if (budgetResult.rejected.length > 0) {
          budgetFiltered += budgetResult.rejected.length;
          errors.push({ source, type: 'budget_filtered', count: budgetResult.rejected.length, budget: Number(budgetMax) });
        }

        const scored = budgetResult.kept.map(scoreRawListing);
        const minScore = filters.minScore ?? filters.min_score ?? (filters.sensitivity === 'aggressive' ? 40 : filters.sensitivity === 'prudent' ? 60 : 50);
        const qualityListings = filterQualityListings(scored, {
          minScore,
          allowBorderlineTargets: true,
          candidateScoreFloor: filters.sensitivity === 'prudent' ? 30 : 20,
        });
        const rejectedCount = scored.length - qualityListings.length;
        if (rejectedCount > 0) {
          qualityFiltered += rejectedCount;
          errors.push({ source, type: 'quality_filtered', count: rejectedCount });
        }

        const { normalized, invalid } = normalizeListings(qualityListings, source, runId);

        if (invalid.length > 0) {
          errors.push(...invalid.map(item => ({ source, type: 'invalid_listing', errors: item.errors })));
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

    const status = errors.length === enabledSources.length ? 'failed' : 'completed';
    scrapeRunRepo.update(runId, {
      status,
      results_count: allListings.length,
      errors_count: errors.length,
      metadata: JSON.stringify({ profile, filters, maxResults, saved, updated, budgetFiltered, qualityFiltered, knownBeforeScan, errors }),
    });

    return {
      run_id: runId,
      status,
      query,
      sources: enabledSources,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      listings: allListings,
      stats: {
        raw_found: rawFound,
        found: allListings.length,
        filtered: allListings.length,
        quality_filtered: qualityFiltered,
        budget_filtered: budgetFiltered,
        known_before_scan: knownBeforeScan,
        saved,
        updated,
        errors: errors.length,
      },
      errors,
    };
  } catch (error) {
    scrapeRunRepo.fail(runId, error.message);
    throw error;
  }
}
