import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../src/data/cards/', import.meta.url);
const expectedCounts = {
  base: 102,
  jungle: 64,
  fossil: 62,
  rocket: 83,
};

for (const [series, expectedCount] of Object.entries(expectedCounts)) {
  const file = path.join(root.pathname, `${series}.json`);
  const cards = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (cards.length !== expectedCount) {
    throw new Error(`${series}: expected ${expectedCount} cards, got ${cards.length}`);
  }

  const ids = new Set();
  for (const card of cards) {
    if (!card.id || !card.name || !card.number || !Array.isArray(card.queryTerms) || card.queryTerms.length === 0) {
      throw new Error(`${series}: invalid card contract ${JSON.stringify(card)}`);
    }
    if (ids.has(card.id)) {
      throw new Error(`${series}: duplicate card id ${card.id}`);
    }
    ids.add(card.id);
  }
}

console.log('✅ Card target JSON data valid');
