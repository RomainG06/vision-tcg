import { initDatabase, run } from './src/db/database.js';
import { logger } from './src/utils/logger.js';

const DEFAULT_KEYWORDS = [
    { keyword: 'wizards', category: 'wizards', weight: 4 },
    { keyword: 'wizard', category: 'wizards', weight: 4 },
    { keyword: 'base set', category: 'edition', weight: 3 },
    { keyword: 'set de base', category: 'edition', weight: 3 },
    { keyword: 'jungle', category: 'edition', weight: 3 },
    { keyword: 'fossile', category: 'edition', weight: 3 },
    { keyword: 'fossil', category: 'edition', weight: 3 },
    { keyword: 'team rocket', category: 'edition', weight: 3 },
    { keyword: 'français', category: 'language', weight: 3 },
    { keyword: 'francais', category: 'language', weight: 3 },
    { keyword: 'fr', category: 'language', weight: 2 },
    { keyword: 'japanese', category: 'negative', weight: -3 },
    { keyword: 'japonais', category: 'negative', weight: -3 },
    { keyword: 'japonaises', category: 'negative', weight: -3 },
    { keyword: 'récentes', category: 'negative', weight: -2 },
    { keyword: 'modernes', category: 'negative', weight: -2 },
];

async function seedKeywords() {
    logger.info('Initializing database...');
    await initDatabase();

    logger.info('Seeding keywords...');
    let inserted = 0;
    let skipped = 0;

    for (const kw of DEFAULT_KEYWORDS) {
        try {
            run(
                'INSERT INTO keywords (keyword, category, weight, active) VALUES (?, ?, ?, 1)',
                [kw.keyword, kw.category, kw.weight]
            );
            inserted++;
            logger.debug(`✓ Inserted: ${kw.keyword}`);
        } catch (error) {
            if (String(error?.message || '').includes('UNIQUE constraint failed')) {
                skipped++;
                logger.debug(`⊘ Skipped (exists): ${kw.keyword}`);
            } else {
                logger.error(`✗ Error inserting ${kw.keyword}:`, error);
            }
        }
    }

    logger.info(`\n✅ Keywords seeded: ${inserted} inserted, ${skipped} skipped (already exist)`);
    logger.info(`Total keywords in database: ${DEFAULT_KEYWORDS.length}`);
}

seedKeywords().catch(error => {
    logger.error('Error seeding keywords:', error);
    process.exit(1);
});
