import { BaseFetcher } from '../src/fetchers/base.js';
import { extractVintedExternalId, selectUnseenVintedItems, selectUnseenVintedUrls } from '../src/fetchers/vinted.js';

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
  
  describe('Vinted smart selection', () => {
    it('extracts Vinted external ids from item URLs', () => {
      expect(extractVintedExternalId('https://www.vinted.fr/items/123456-pokemon-team-rocket')).toBe('123456');
      expect(extractVintedExternalId('https://www.vinted.fr/items/987654')).toBe('987654');
      expect(extractVintedExternalId('https://www.vinted.fr/catalog')).toBeNull();
    });

    it('skips already seen Vinted URLs before detail scraping', () => {
      const urls = [
        'https://www.vinted.fr/items/111-old-seen',
        'https://www.vinted.fr/items/222-new-one',
        'https://www.vinted.fr/items/333-new-two',
      ];

      const selected = selectUnseenVintedUrls(urls, {
        excludeExternalIds: new Set(['111']),
        maxResults: 2,
      });

      expect(selected).toEqual([
        'https://www.vinted.fr/items/222-new-one',
        'https://www.vinted.fr/items/333-new-two',
      ]);
    });

    it('prefilters off-series Vinted cards before opening detail pages', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/101-one-piece-card-game-pillars-of-strength-eustass-captain-kid-op01-051-english',
          text: 'One Piece Card Game- Pillars Of Strength- Eustass Captain Kid OP01-051 English',
        },
        {
          url: 'https://www.vinted.fr/items/102-regice-24-98-fr-excellent',
          text: 'Regice 24/98 – FR – Excellent+',
        },
        {
          url: 'https://www.vinted.fr/items/103-evoli-reverse-54-78-fr-mint',
          text: 'Évoli reverse 54/78 – FR – Mint !',
        },
        {
          url: 'https://www.vinted.fr/items/104-feurisson-obscur-39-105-wizards-neo-destiny-2002',
          text: 'Carte Pokémon Feurisson obscur 39/105 - Wizards Neo Destiny 2002',
        },
        {
          url: 'https://www.vinted.fr/items/105-dracolosse-obscur-edition-1-22-82',
          text: 'Dracolosse Obscur Edition 1 22/82 Team Rocket Français',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'rocket',
        maxResults: 10,
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/105-dracolosse-obscur-edition-1-22-82',
      ]);
    });

    it('relaxes grid prefilter for Jungle because Vinted often hides series names before detail pages', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/201-carte-pokemon-nidoran-edition-1-wizards',
          text: 'Carte Pokémon Nidoran édition 1 Wizards FR',
        },
        {
          url: 'https://www.vinted.fr/items/202-scarabrute-9-64-jungle-fr',
          text: 'Scarabrute 9/64 holo français',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'jungle',
        maxResults: 2,
      });

      expect(selected.map(item => item.url)).toEqual([
        'https://www.vinted.fr/items/202-scarabrute-9-64-jungle-fr',
      ]);
    });

    it('opens a few unseen Jungle candidates when the grid text has no explicit series signal', () => {
      const items = [
        {
          url: 'https://www.vinted.fr/items/301-carte-pokemon-wizards-fr-edition-1',
          text: 'Carte Pokémon Wizards FR édition 1 bon état',
        },
        {
          url: 'https://www.vinted.fr/items/302-lot-cartes-pokemon-anciennes-fr',
          text: 'Lot cartes Pokémon anciennes françaises',
        },
      ];

      const selected = selectUnseenVintedItems(items, {
        targetSeries: 'jungle',
        maxResults: 2,
      });

      expect(selected).toHaveLength(2);
      expect(selected.every(item => item.prefilter_relaxed)).toBe(true);
    });
  });
  
  // TODO: Add integration tests with actual fetchers
  // These would require mocking browser or using real browser in CI
});
