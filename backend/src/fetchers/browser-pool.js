import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';

/**
 * Browser Pool Singleton
 * Manages a pool of reusable Puppeteer browser instances
 * Prevents expensive browser launches on every scrape request
 */
class BrowserPool {
    constructor() {
        this.browsers = [];
        this.inUseBrowsers = new Set();
        this.maxBrowsers = 3;
        this.launchOptions = {
            headless: true,
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

    /**
     * Acquire a browser instance from the pool
     * Creates a new one if pool is not full and no browsers available
     * Waits if all browsers are in use and max capacity reached
     * 
     * @returns {Promise<Browser>} Puppeteer browser instance
     */
    async acquire() {
        // Try to get an available browser from the pool
        for (const browser of this.browsers) {
            if (!this.inUseBrowsers.has(browser)) {
                try {
                    // Check if browser is still connected
                    if (browser.isConnected()) {
                        this.inUseBrowsers.add(browser);
                        logger.debug('Reusing browser from pool');
                        return browser;
                    } else {
                        // Remove disconnected browser
                        logger.debug('Removing disconnected browser from pool');
                        this.browsers = this.browsers.filter(b => b !== browser);
                    }
                } catch (error) {
                    logger.warn('Error checking browser connection:', error);
                    this.browsers = this.browsers.filter(b => b !== browser);
                }
            }
        }

        // Create new browser if under capacity
        if (this.browsers.length < this.maxBrowsers) {
            logger.info('Launching new browser instance...');
            const browser = await puppeteer.launch(this.launchOptions);
            this.browsers.push(browser);
            this.inUseBrowsers.add(browser);
            logger.info(`Browser launched. Pool size: ${this.browsers.length}/${this.maxBrowsers}`);
            return browser;
        }

        // Wait for an available browser (poll every 500ms)
        logger.debug('All browsers in use, waiting for availability...');
        await new Promise(resolve => setTimeout(resolve, 500));
        return this.acquire(); // Recursive retry
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
        const closePromises = this.browsers.map(async browser => {
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
            maxCapacity: this.maxBrowsers
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
