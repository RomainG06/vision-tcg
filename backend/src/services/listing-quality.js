const WIZARDS_PATTERN = /\b(wizards|wotc|base set|set de base|jungle|fossile|fossil|team rocket|gym|neo genesis|neo|wizard)\b/i;
const FRENCH_PATTERN = /\b(fr|vf|français|francais|française|francaise|édition française|edition francaise)\b/i;
const LOT_PATTERN = /\b(lot|collection|cartes|vrac|classeur|set complet|complete set)\b/i;

const NOISE_PATTERNS = [
  { code: 'modern_detected', pattern: /\b(écarlate|ecarlate|violet|epee|épée|bouclier|sword|shield|scarlet|sun|moon|soleil|lune|moderne|display moderne|booster moderne)\b/i },
  { code: 'accessory_detected', pattern: /\b(sleeves?|protections?|toploader|top loader|classeur vide|binder empty|accessoires?|rangement|boite vide|box vide)\b/i },
  { code: 'foreign_language_detected', pattern: /\b(japonais|japonaise|japanese|anglais|english|allemand|german|italien|italian|espagnol|spanish)\b/i },
  { code: 'fake_detected', pattern: /\b(fake|proxy|reproduction|repro|custom|fan made|non officiel)\b/i },
  { code: 'energy_bulk_detected', pattern: /\b(énergies?|energies?|cartes énergie|cartes energie)\b/i },
  { code: 'toy_detected', pattern: /\b(figurine|peluche|jouet|mug|poster|sticker|autocollant)\b/i },
];

function textOf(listing) {
  return `${listing.title || ''} ${listing.description || ''}`.trim();
}

export function evaluateListingQuality(listing, options = {}) {
  const minScore = options.minScore ?? 50;
  const text = textOf(listing);
  const signals = [];
  const noise = [];
  const score = Number(listing.score || 0);

  if (WIZARDS_PATTERN.test(text)) signals.push('wizards_detected');
  if (FRENCH_PATTERN.test(text)) signals.push('french_edition');
  if (LOT_PATTERN.test(text)) signals.push('lot_detected');
  if (/\b(holo|holographique|brillante|rare|dracaufeu|tortank|florizarre|mewtwo|ronflex)\b/i.test(text)) signals.push('premium_card_detected');

  for (const rule of NOISE_PATTERNS) {
    if (rule.pattern.test(text)) noise.push(rule.code);
  }

  const hasTargetSignal = signals.includes('wizards_detected') || signals.includes('french_edition');
  const keep = score >= minScore && hasTargetSignal && noise.length === 0;

  let reason = 'candidate_ok';
  if (score < minScore) reason = 'score_below_threshold';
  else if (!hasTargetSignal) reason = 'missing_wizards_or_french_signal';
  else if (noise.length > 0) reason = 'noise_detected';

  return {
    keep,
    reason,
    minScore,
    score,
    signals: [...new Set(signals)],
    noise: [...new Set(noise)],
  };
}

export function annotateListingQuality(listing, options = {}) {
  const quality = evaluateListingQuality(listing, options);
  const scoreBreakdown = listing.score_breakdown || {};
  const existingSignals = Array.isArray(scoreBreakdown.signals) ? scoreBreakdown.signals : [];
  const existingRisks = Array.isArray(scoreBreakdown.risks) ? scoreBreakdown.risks : [];

  return {
    ...listing,
    quality,
    score_breakdown: {
      ...scoreBreakdown,
      signals: [...new Set([...existingSignals, ...quality.signals])],
      risks: [...new Set([...existingRisks, ...quality.noise])],
      quality,
    },
  };
}

export function filterQualityListings(listings, options = {}) {
  return listings
    .map((listing) => annotateListingQuality(listing, options))
    .filter((listing) => listing.quality.keep);
}
