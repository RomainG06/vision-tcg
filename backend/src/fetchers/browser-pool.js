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
        this.defaultArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--lang=fr-FR,fr',
            '--window-size=1920,1080'
        ];
        this.leboncoinArgs = [
            '--disable-blink-features=AutomationControlled',
            '--lang=fr-FR,fr',
            '--window-size=1920,1080',
            '--no-first-run',
            '--no-default-browser-check'
        ];
    }

    getHeadlessForSource(source = 'default') {
        return config.scraping.headlessBySource?.[source] ?? config.scraping.headless;
    }

    getLaunchOptions(source = 'default') {
        const headless = this.getHeadlessForSource(source);
        const executablePath = config.scraping.executablePathBySource?.[source];
        const userDataDir = config.scraping.userDataDirBySource?.[source];
        const launchOptions = {
            args: source === 'leboncoin' ? this.leboncoinArgs : this.defaultArgs,
            headless,
        };

        if (executablePath) {
            launchOptions.executablePath = executablePath;
        }

        if (userDataDir) {
            launchOptions.userDataDir = userDataDir;
        }

        return launchOptions;
    }

    getPoolKey(source = 'default') {
        const headless = this.getHeadlessForSource(source);
        const executablePath = config.scraping.executablePathBySource?.[source] || 'bundled';
        const userDataDir = config.scraping.userDataDirBySource?.[source] || 'temp-profile';
        return `${source}:${headless ? 'headless' : 'headful'}:${executablePath}:${userDataDir}`;
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
            const launchOptions = this.getLaunchOptions(source);
            const browserLabel = launchOptions.executablePath ? 'configured Chrome' : 'bundled Chromium';
            const profileLabel = launchOptions.userDataDir ? 'persistent profile' : 'temporary profile';
            logger.info(`Launching new browser instance for ${source} (${headless ? 'headless' : 'headful'}, ${browserLabel}, ${profileLabel})...`);
            const browser = await puppeteer.launch(launchOptions);
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
