import { describe, expect, test } from '@jest/globals';
import { createScrapeJobManager, ScrapeAlreadyRunningError } from '../src/services/scrape-job-manager.js';

describe('Scrape job manager', () => {
  test('rejects a second scrape while one is already running', async () => {
    let release;
    const manager = createScrapeJobManager({
      startScrape: () => new Promise(resolve => { release = () => resolve({ status: 'completed', stats: {} }); }),
    });

    const first = manager.start({ filters: { series: 'rocket' } });

    await expect(manager.start({ filters: { series: 'rocket' } }))
      .rejects
      .toBeInstanceOf(ScrapeAlreadyRunningError);

    expect(manager.getStatus()).toMatchObject({ state: 'running' });

    release();
    await first;

    expect(manager.getStatus()).toMatchObject({ state: 'idle' });
  });

  test('returns a failed JSON-safe result when the scrape implementation throws', async () => {
    const manager = createScrapeJobManager({
      startScrape: async () => {
        throw new Error('Puppeteer crashed');
      },
    });

    const result = await manager.start({ filters: { series: 'rocket' } });

    expect(result).toMatchObject({
      status: 'failed',
      error: 'Scrape failed',
      message: 'Puppeteer crashed',
    });
    expect(manager.getStatus()).toMatchObject({
      state: 'idle',
      last_status: 'failed',
    });
  });
});
