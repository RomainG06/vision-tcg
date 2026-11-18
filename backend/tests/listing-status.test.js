import { assertValidListingStatus, normalizeListingStatus, VALID_LISTING_STATUSES } from '../src/services/listing-status.js';

describe('listing-status', () => {
  it('normalizes legacy UI aliases to MVP statuses', () => {
    expect(normalizeListingStatus('passed')).toBe('ignored');
    expect(normalizeListingStatus('rejected')).toBe('ignored');
    expect(normalizeListingStatus('viewed')).toBe('reviewed');
    expect(normalizeListingStatus('interesting')).toBe('interested');
    expect(normalizeListingStatus('watchlist')).toBe('interested');
  });

  it('accepts canonical workflow statuses', () => {
    expect(VALID_LISTING_STATUSES).toEqual(['new', 'interested', 'reviewed', 'ignored', 'contacted', 'purchased']);
    expect(assertValidListingStatus('contacted')).toBe('contacted');
  });

  it('rejects unknown statuses', () => {
    expect(() => assertValidListingStatus('maybe')).toThrow('Invalid listing status');
  });
});
