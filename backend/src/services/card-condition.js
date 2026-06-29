export function normalizeCardCondition(value) {
  if (!value) return null;
  const text = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const matchers = [
    { key: 'damaged', label: 'Damaged', rank: 10, pattern: /\b(damaged|abimee?|abime|tres\s+abimee?|pli(?:e|ee|ure)|dechiree?|poor|hp|heavy\s+played)\b/ },
    { key: 'played', label: 'Played', rank: 30, pattern: /\b(played|pl|jouee?|moyen(?:ne)?|etat\s+moyen|moderately\s+played|mp)\b/ },
    { key: 'light_played', label: 'LP', rank: 45, pattern: /\b(light\s+played|lp|legerement\s+jouee?|bon\s+etat|good)\b/ },
    { key: 'excellent', label: 'Excellent', rank: 60, pattern: /\b(excellent|ex\+?|very\s+good|tres\s+bon\s+etat)\b/ },
    { key: 'near_mint', label: 'NM', rank: 80, pattern: /\b(near\s+mint|near-mint|nm|mint-|mint\s-)\b|\betat\s+neuf\b|\bcomme\s+neuve?\b/ },
    { key: 'mint', label: 'Mint', rank: 90, pattern: /\b(mint|neuve?|neuf)\b/ },
  ];

  for (const matcher of matchers) {
    if (matcher.pattern.test(text)) {
      return { key: matcher.key, label: matcher.label, rank: matcher.rank };
    }
  }

  return null;
}

export function detectListingCondition(listing = {}) {
  return normalizeCardCondition([
    listing.condition,
    listing.title,
    listing.description,
  ].filter(Boolean).join(' '));
}
