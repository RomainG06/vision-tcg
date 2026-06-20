import express from 'express';
import { logger } from '../utils/logger.js';
import { ProfileRepository } from '../repositories/profile-repository.js';
import { ListingRepository } from '../repositories/listing-repository.js';
import { ScrapeRunRepository } from '../repositories/scrape-run-repository.js';
import { normalizeListings } from '../services/normalizer.js';
import { scoreListings, filterListings } from '../services/scorer.js';

const router = express.Router();

// Initialize repositories
const profileRepo = new ProfileRepository();
const listingRepo = new ListingRepository();
const scrapeRunRepo = new ScrapeRunRepository();

/**
 * GET /api/profiles
 * List all available profiles
 */
router.get('/profiles', (req, res) => {
  try {
    const profiles = profileRepo.list();
    res.json({ profiles });
  } catch (error) {
    logger.error('Error listing profiles:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/profiles/:name
 * Get a specific profile by name
 */
router.get('/profiles/:name', (req, res) => {
  try {
    const profile = profileRepo.load(req.params.name);
    res.json({ profile });
  } catch (error) {
    logger.error(`Error loading profile ${req.params.name}:`, error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/scrape
 * Start a scraping run using a profile
 * 
 * Body:
 * {
 *   "profile": "wizards-fr",
 *   "sources": ["leboncoin", "vinted"],  // optional, defaults to profile.scraping.sources
 *   "maxResults": 50,                     // optional, defaults to profile.scraping.max_results_per_source
 *   "saveToDb": true                      // optional, defaults to true
 * }
 */
router.post('/scrape', async (req, res) => {
  const { profile: profileName, sources, maxResults, saveToDb = true } = req.body;
  
  if (!profileName) {
    return res.status(400).json({ error: 'Profile name is required' });
  }
  
  try {
    // Load profile
    const profile = profileRepo.load(profileName);
    
    if (!profile.enabled) {
      return res.status(400).json({ error: `Profile ${profileName} is disabled` });
    }
    
    // Determine sources
    const activeSources = sources || profile.scraping?.sources || ['leboncoin', 'vinted'];
    const resultsLimit = maxResults || profile.scraping?.max_results_per_source || 50;
    
    // Create scrape run (store profile in metadata)
    const scrapeRunId = scrapeRunRepo.create({
      source: activeSources.join(','),
      query: profile.search.keywords.join(' OR '),
      status: 'running',
      metadata: JSON.stringify({
        profile: profileName,
        sources: activeSources,
        maxResults: resultsLimit
      })
    });
    
    logger.info(`Starting scrape run ${scrapeRunId} for profile ${profileName}`);
    
    // Collect all raw listings
    const allRawListings = [];
    const errors = [];
    
    // Scrape each source
    for (const source of activeSources) {
      for (const keyword of profile.search.keywords) {
        try {
          logger.info(`Scraping ${source} with keyword: "${keyword}"`);
          
          let rawListings = [];
          
          if (source === 'leboncoin') {
            const { fetchLeboncoin } = await import('../fetchers/leboncoin.js');
            rawListings = await fetchLeboncoin(keyword, {
              maxResults: resultsLimit,
            });
          } else if (source === 'vinted') {
            const { fetchVinted } = await import('../fetchers/vinted.js');
            rawListings = await fetchVinted(keyword, {
              maxResults: resultsLimit
            });
          } else {
            logger.warn(`Unknown source: ${source}`);
            continue;
          }
          
          logger.info(`Fetched ${rawListings.length} listings from ${source}`);
          allRawListings.push(...rawListings);
          
        } catch (error) {
          logger.error(`Error scraping ${source} with keyword "${keyword}":`, error);
          errors.push({
            source,
            keyword,
            error: error.message
          });
          
          // If CAPTCHA detected, mark as captcha_required
          if (error.message?.includes('CAPTCHA')) {
            scrapeRunRepo.update(scrapeRunId, { status: 'captcha_required' });
            return res.status(503).json({
              scrapeRunId: scrapeRunId,
              status: 'captcha_required',
              message: 'CAPTCHA detected. Manual intervention required.',
              error: error.message
            });
          }
        }
      }
    }
    
    // Normalize listings
    logger.info(`Normalizing ${allRawListings.length} raw listings`);
    const allNormalized = [];
    const allInvalid = [];
    
    // Group by source for normalization
    const bySource = {};
    for (const raw of allRawListings) {
      const src = raw.source || 'unknown';
      if (!bySource[src]) bySource[src] = [];
      bySource[src].push(raw);
    }
    
    // Normalize each source group
    for (const [source, listings] of Object.entries(bySource)) {
      const { normalized, invalid } = normalizeListings(listings, source, scrapeRunId);
      allNormalized.push(...normalized);
      allInvalid.push(...invalid);
    }
    
    logger.info(`Normalized: ${allNormalized.length} valid, ${allInvalid.length} invalid`);
    
    // Score listings using profile
    logger.info(`Scoring ${allNormalized.length} normalized listings`);
    const scored = scoreListings(allNormalized, profile);
    
    // Filter by profile criteria
    logger.info('Filtering by profile criteria (budget, distance, min_score)');
    const filtered = filterListings(scored, profile);
    
    logger.info(`${filtered.length} listings passed filters`);
    
    // Save to database if requested
    let savedCount = 0;
    let updatedCount = 0;
    
    if (saveToDb && filtered.length > 0) {
      for (const listing of filtered) {
        try {
          const result = listingRepo.upsert(listing);
          if (result.created) savedCount++;
          if (result.updated) updatedCount++;
        } catch (error) {
          logger.error('Error saving listing:', error);
        }
      }
      logger.info(`Saved/updated listings: ${savedCount} new, ${updatedCount} updated`);
    }
    
    // Complete scrape run
    scrapeRunRepo.complete(scrapeRunId, {
      results_count: filtered.length,
      errors_count: errors.length
    });
    
    // Return results
    res.json({
      scrapeRunId: scrapeRunId,
      status: 'completed',
      profile: profileName,
      sources: activeSources,
      stats: {
        raw: allRawListings.length,
        normalized: allNormalized.length,
        invalid: allInvalid.length,
        scored: scored.length,
        filtered: filtered.length,
        saved: savedCount,
        updated: updatedCount,
        errors: errors.length
      },
      listings: filtered.slice(0, 20), // Return top 20 only in response
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    logger.error('Scrape error:', error);
    
    // Try to fail the scrape run if it was created
    if (typeof scrapeRunId !== 'undefined') {
      try {
        scrapeRunRepo.fail(scrapeRunId, error.message);
      } catch (failError) {
        logger.error('Error failing scrape run:', failError);
      }
    }
    
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
