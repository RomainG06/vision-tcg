let scoreListing;
let calculateDistance;
let estimateCardCount;

describe('Scorer', () => {
  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const { migrate } = await import('../src/db/migrations.js');
    await migrate();
    ({ scoreListing, calculateDistance, estimateCardCount } = await import('../src/scoring/scorer.js'));
  });
  
  describe('scoreListing', () => {
    it('should score Wizards + French lot highly', () => {
      const listing = {
        title: 'Lot Pokemon Wizards Base Set Français',
        description: 'Collection de 150 cartes Wizards en français',
        price: 80,
        distance_km: 5,
        card_count_estimate: 150
      };
      
      const score = scoreListing(listing);
      expect(score).toBeGreaterThan(70);
      expect(listing.is_wizards).toBe(1);
      expect(listing.is_french).toBe(1);
      expect(listing.is_lot).toBe(1);
    });
    
    it('should score modern cards lower', () => {
      const listing = {
        title: 'Cartes Pokemon récentes',
        description: 'Cartes modernes Épée et Bouclier',
        price: 50,
        distance_km: 10
      };
      
      const score = scoreListing(listing);
      expect(score).toBeLessThan(40);
      expect(listing.is_wizards).toBe(0);
    });
    
    it('should penalize Japanese cards', () => {
      const listing = {
        title: 'Pokemon cards Japanese',
        description: 'Cartes japonaises',
        price: 30,
        distance_km: 5
      };
      
      const score = scoreListing(listing);
      expect(score).toBeLessThan(50);
    });
  });
  
  describe('calculateDistance', () => {
    it('should calculate distance between Nice and Antibes', () => {
      const distance = calculateDistance(43.7102, 7.2620, 43.5808, 7.1239);
      expect(distance).toBeGreaterThan(10);
      expect(distance).toBeLessThan(20);
    });
    
    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(43.7102, 7.2620, 43.7102, 7.2620);
      expect(distance).toBe(0);
    });
  });
  
  describe('estimateCardCount', () => {
    it('should extract explicit card count', () => {
      const count = estimateCardCount('Lot de 150 cartes Pokemon');
      expect(count).toBe(150);
    });
    
    it('should estimate from "lot" keyword', () => {
      const count = estimateCardCount('Lot Pokemon');
      expect(count).toBe(100);
    });
    
    it('should return null if no indicators', () => {
      const count = estimateCardCount('Une carte Pokemon');
      expect(count).toBeNull();
    });
  });
});
