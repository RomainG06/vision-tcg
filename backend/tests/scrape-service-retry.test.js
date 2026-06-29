import { describe, expect, test } from '@jest/globals';
import { isTransientMarketplaceError } from '../src/services/marketplace-retry.js';
import { getScanModePreset } from '../src/services/scan-mode.js';

describe('scrape marketplace retry classification', () => {
  test('uses balanced scan-mode presets for daily vs deep scans', () => {
    expect(getScanModePreset({ scanMode: 'quick' })).toMatchObject({
      scanMode: 'quick',
      scanDepthMultiplier: 3,
      minScanDepth: 30,
      maxScrollPasses: 3,
      allowSeenRescue: false,
    });
    expect(getScanModePreset({ scanMode: 'deep' })).toMatchObject({
      scanMode: 'deep',
      scanDepthMultiplier: 8,
      minScanDepth: 100,
      maxScrollPasses: 8,
      allowSeenRescue: true,
    });
  });

  test('detects transient connection/browser marketplace errors', () => {
    expect(isTransientMarketplaceError(new Error('connexion marketplace impossible'))).toBe(true);
    expect(isTransientMarketplaceError(new Error('fetch failed'))).toBe(true);
    expect(isTransientMarketplaceError(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }))).toBe(true);
    expect(isTransientMarketplaceError(new Error('Navigation timeout of 30000 ms exceeded'))).toBe(true);
    expect(isTransientMarketplaceError(new Error('Protocol error: Target closed'))).toBe(true);
  });

  test('does not retry deterministic quality/configuration errors', () => {
    expect(isTransientMarketplaceError(new Error('No supported source selected'))).toBe(false);
    expect(isTransientMarketplaceError(new Error('Missing eBay API credentials'))).toBe(false);
    expect(isTransientMarketplaceError(new Error('series_mismatch'))).toBe(false);
  });
});
