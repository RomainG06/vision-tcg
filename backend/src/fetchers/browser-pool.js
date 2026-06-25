import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';

/**
 * Browser Pool Singleton
 * Manages reusable Puppeteer browser instances by source + display mode.
 * This avoids reusing a Vinted headless browser for Leboncoin, where a visible
 * window is useful for manual DataDome/CAPTCHA intervention.
 */
class BrowserPool {
    constructor() {
        this.browsers = [];
        this.inUseBrowsers = new Set();
        this.maxBrowsers = 3;
        this.baseLaunchOptions = {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        };
    }

    getHeadlessForSource(source = 'default') {
        return config.scraping.headlessBySource?.[source] ?? config.scraping.headless;
    }

    getLaunchOptions(source = 'default') {
        const headless = this.getHeadlessForSource(source);
        return {
            ...this.baseLaunchOptions,
            headless,
        };
    }

    getPoolKey(source = 'default') {
        const headless = this.getHeadlessForSource(source);
        return `${source}:${headless ? 'headless' : 'headful'}`;
    }

    /**
     * Acquire a browser instance from the pool.
     * Creates/reuses a browser matching the requested marketplace mode.
     *
     * @param {Object} options
     * @param {string} options.source - Marketplace source (vinted, leboncoin, facebook)
     * @returns {Promise<Browser>} Puppeteer browser instance
     */
    async acquire({ source = 'default' } = {}) {
        const poolKey = this.getPoolKey(source);
        const headless = this.getHeadlessForSource(source);

        // Try to get an available browser from the matching pool bucket.
        for (const entry of this.browsers) {
            const { browser, key } = entry;
            if (key !== poolKey || this.inUseBrowsers.has(browser)) continue;

            try {
                if (browser.isConnected()) {
                    this.inUseBrowsers.add(browser);
                    logger.debug(`Reusing ${poolKey} browser from pool`);
                    return browser;
                }

                logger.debug(`Removing disconnected ${poolKey} browser from pool`);
                this.browsers = this.browsers.filter(item => item.browser !== browser);
            } catch (error) {
                logger.warn('Error checking browser connection:', error);
                this.browsers = this.browsers.filter(item => item.browser !== browser);
            }
        }

        // Create new browser if under capacity.
        if (this.browsers.length < this.maxBrowsers) {
            logger.info(`Launching new browser instance for ${source} (${headless ? 'headless' : 'headful'})...`);
            const browser = await puppeteer.launch(this.getLaunchOptions(source));
            this.browsers.push({ browser, key: poolKey, source, headless });
            this.inUseBrowsers.add(browser);
            logger.info(`Browser launched. Pool size: ${this.browsers.length}/${this.maxBrowsers}`);
            return browser;
        }

        // Wait for an available browser (poll every 500ms).
        logger.debug('All browsers in use, waiting for availability...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.acquire({ source });
    }

    /**
     * Release a browser back to the pool
     *
     * @param {Browser} browser - Browser instance to release
     */
    release(browser) {
        if (this.inUseBrowsers.has(browser)) {
            this.inUseBrowsers.delete(browser);
            logger.debug(`Browser released. In use: ${this.inUseBrowsers.size}/${this.browsers.length}`);
        }
    }

    /**
     * Close all browsers in the pool
     * Call this on application shutdown
     */
    async closeAll() {
        logger.info('Closing all browsers in pool...');
        const closePromises = this.browsers.map(async ({ browser }) => {
            try {
                if (browser.isConnected()) {
                    await browser.close();
                }
            } catch (error) {
                logger.warn('Error closing browser:', error);
            }
        });

        await Promise.all(closePromises);
        this.browsers = [];
        this.inUseBrowsers.clear();
        logger.info('All browsers closed');
    }

    /**
     * Get pool statistics
     *
     * @returns {Object} Pool stats
     */
    getStats() {
        return {
            total: this.browsers.length,
            inUse: this.inUseBrowsers.size,
            available: this.browsers.length - this.inUseBrowsers.size,
            maxCapacity: this.maxBrowsers,
            modes: this.browsers.map(({ source, headless }) => ({
                source,
                mode: headless ? 'headless' : 'headful'
            }))
        };
    }
}

// Export singleton instance
export const browserPool = new BrowserPool();

// Cleanup on process exit
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, closing browser pool...');
    await browserPool.closeAll();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, closing browser pool...');
    await browserPool.closeAll();
    process.exit(0);
});
