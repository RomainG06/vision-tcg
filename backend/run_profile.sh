#!/bin/bash
#
# run_profile.sh - Execute scraping for a specific profile
# Usage: ./run_profile.sh <profile_name>
# Exit codes:
#   0 = Success
#   1 = Invalid arguments or profile not found
#   2 = CAPTCHA detected (manual intervention required)
#   3 = Other error (network, parsing, etc.)
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get profile name from argument
PROFILE_NAME="${1:-}"

if [ -z "$PROFILE_NAME" ]; then
  echo -e "${RED}Error: Profile name required${NC}"
  echo "Usage: $0 <profile_name>"
  echo "Example: $0 wizards-fr"
  exit 1
fi

# Check if profile exists
PROFILE_PATH="./profiles/${PROFILE_NAME}.json"
if [ ! -f "$PROFILE_PATH" ]; then
  echo -e "${RED}Error: Profile not found: $PROFILE_PATH${NC}"
  exit 1
fi

echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] Starting scrape for profile: ${PROFILE_NAME}${NC}"

# Run the scrape
node -e "
import { ProfileRepository } from './src/repositories/profile-repository.js';
import { ListingRepository } from './src/repositories/listing-repository.js';
import { ScrapeRunRepository } from './src/repositories/scrape-run-repository.js';
import { fetchLeboncoin } from './src/fetchers/leboncoin.js';
import { fetchVinted } from './src/fetchers/vinted.js';
import { normalizeListing } from './src/services/normalizer.js';
import { scoreListing, filterListings } from './src/services/scorer.js';
import { initDatabase } from './src/db/database.js';
import { logger } from './src/utils/logger.js';

async function runProfile(profileName) {
  try {
    // Initialize database
    await initDatabase();
    
    // Load repositories
    const profileRepo = new ProfileRepository();
    const listingRepo = new ListingRepository();
    const scrapeRunRepo = new ScrapeRunRepository();
    
    // Load profile
    const profile = profileRepo.load(profileName);
    logger.info('Profile loaded', { name: profile.name, sources: profile.scraping.sources });
    
    if (!profile.enabled) {
      logger.warn('Profile is disabled', { name: profileName });
      process.exit(0);
    }
    
    let totalNew = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let captchaDetected = false;
    
    // Process each source
    for (const source of profile.scraping.sources) {
      for (const keyword of profile.search.keywords) {
        // Create scrape run record
        const runId = scrapeRunRepo.create({
          source,
          query: keyword,
          status: 'running'
        });
        
        try {
          logger.info('Fetching', { source, keyword });
          
          let rawListings = [];
          if (source === 'leboncoin') {
            rawListings = await fetchLeboncoin(keyword);
          } else if (source === 'vinted') {
            rawListings = await fetchVinted(keyword);
          }
          
          // Check for CAPTCHA in results
          if (rawListings.captcha) {
            captchaDetected = true;
            scrapeRunRepo.fail(runId, 'CAPTCHA detected');
            logger.warn('CAPTCHA detected', { source, keyword });
            continue;
          }
          
          // Normalize listings
          const normalized = rawListings.map(raw => 
            normalizeListing(raw, source, runId)
          );
          
          // Score listings
          const scored = normalized.map(listing => {
            const { score, breakdown } = scoreListing(listing, profile);
            return {
              ...listing,
              score,
              score_breakdown: JSON.stringify(breakdown)
            };
          });
          
          // Filter by profile criteria
          const filtered = filterListings(scored, profile);
          
          logger.info('Filtered listings', { 
            total: scored.length, 
            filtered: filtered.length,
            source,
            keyword
          });
          
          // Upsert to database
          let newCount = 0;
          let updatedCount = 0;
          
          for (const listing of filtered) {
            const existing = listingRepo.findBySourceAndExternalId(
              listing.source,
              listing.external_id
            );
            
            if (existing) {
              // Update existing
              listingRepo.update(existing.id, {
                title: listing.title,
                price: listing.price,
                score: listing.score,
                last_seen_at: new Date().toISOString()
              });
              updatedCount++;
            } else {
              // Insert new
              listingRepo.upsert(listing);
              newCount++;
            }
          }
          
          totalNew += newCount;
          totalUpdated += updatedCount;
          
          // Mark scrape run as complete
          scrapeRunRepo.complete(runId, {
            results_count: filtered.length,
            errors_count: 0
          });
          
          logger.info('Scrape complete', { 
            source, 
            keyword, 
            new: newCount, 
            updated: updatedCount 
          });
          
        } catch (error) {
          totalErrors++;
          scrapeRunRepo.fail(runId, error.message);
          logger.error('Scrape failed', { 
            source, 
            keyword, 
            error: error.message 
          });
        }
      }
    }
    
    // Summary
    logger.info('Profile run complete', {
      profile: profileName,
      new: totalNew,
      updated: totalUpdated,
      errors: totalErrors,
      captcha: captchaDetected
    });
    
    // Exit with appropriate code
    if (captchaDetected) {
      process.exit(2); // CAPTCHA requires manual intervention
    } else if (totalErrors > 0 && totalNew === 0 && totalUpdated === 0) {
      process.exit(3); // Complete failure
    } else {
      process.exit(0); // Success (even if some errors)
    }
    
  } catch (error) {
    logger.error('Fatal error', { error: error.message, stack: error.stack });
    process.exit(3);
  }
}

runProfile('${PROFILE_NAME}');
"

EXIT_CODE=$?

case $EXIT_CODE in
  0)
    echo -e "${GREEN}✓ Success${NC}"
    ;;
  2)
    echo -e "${YELLOW}⚠ CAPTCHA detected - manual intervention required${NC}"
    ;;
  3)
    echo -e "${RED}✗ Error occurred${NC}"
    ;;
  *)
    echo -e "${RED}✗ Unknown exit code: $EXIT_CODE${NC}"
    ;;
esac

exit $EXIT_CODE
