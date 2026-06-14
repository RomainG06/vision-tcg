import { BaseFetcher } from '../src/fetchers/base.js';

describe('Fetchers', () => {
  describe('BaseFetcher', () => {
    let fetcher;
    
    beforeEach(() => {
      fetcher = new BaseFetcher('test');
    });
    
    it('should initialize with source name', () => {
      expect(fetcher.source).toBe('test');
    });
    
    it('should throw error if fetch not implemented', async () => {
      await expect(fetcher.fetch('test')).rejects.toThrow('fetch() must be implemented');
    });
  });
  
  // TODO: Add integration tests with actual fetchers
  // These would require mocking browser or using real browser in CI
});
