const WIZARDS_PATTERN = /\b(wizards|wotc|base set|set de base|jungle|fossile|fossil|team rocket|gym|neo genesis|neo|wizard)\b/i;
const FRENCH_PATTERN = /\b(fr|vf|français|francais|française|francaise|édition française|edition francaise)\b/i;
const LOT_PATTERN = /\b(lot|collection|vrac|classeur|set complet|complete set)\b/i;
const SINGLE_CARD_PATTERN = /\b(carte seule|carte unique|à l'unité|a l'unite|unitaire|single card|dracaufeu|tortank|florizarre|mewtwo|pikachu)\b/i;
const POKEMON_CARD_PATTERN = /\b(pokemon|pokémon|carte|cartes|holo|rare|jungle|fossile|fossil|rocket|dracaufeu|tortank|florizarre|mewtwo|pikachu)\b/i;

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

function shouldIgnoreNoise(code, text, signals) {
  const hasFrenchSignal = signals.includes('french_edition');
  const hasCardSignal = POKEMON_CARD_PATTERN.test(text) || signals.includes('wizards_detected') || signals.includes('premium_card_detected');

  if (code === 'foreign_language_detected' && hasFrenchSignal) {
    return true;
  }

  if (code === 'accessory_detected' && hasCardSignal) {
    const shippingProtectionContext = /\b(protection|protégé|protege|envoi|expédié|expedie|soigné|soigne|rigide|top loader offert|sleeve offerte)\b/i.test(text);
    const accessoryOnlyContext = /\b(lot de sleeves?|sleeves? seules?|toploaders? seuls?|classeur vide|accessoires? seuls?|rangement seul)\b/i.test(text);
    return shippingProtectionContext && !accessoryOnlyContext;
  }

  return false;
}

export function evaluateListingQuality(listing, options = {}) {
  const minScore = options.minScore ?? 50;
  const candidateScoreFloor = options.candidateScoreFloor ?? 20;
  const allowBorderlineTargets = Boolean(options.allowBorderlineTargets);
  const text = textOf(listing);
  const signals = [];
  const noise = [];
  const score = Number(listing.score || 0);

  if (WIZARDS_PATTERN.test(text)) signals.push('wizards_detected');
  if (FRENCH_PATTERN.test(text)) signals.push('french_edition');
  if (isLotListingText(text)) signals.push('lot_detected');
  if (/\b(holo|holographique|brillante|rare|dracaufeu|tortank|florizarre|mewtwo|ronflex)\b/i.test(text)) signals.push('premium_card_detected');

  for (const rule of NOISE_PATTERNS) {
    if (rule.pattern.test(text) && !shouldIgnoreNoise(rule.code, text, signals)) {
      noise.push(rule.code);
    }
  }

  const hasTargetSignal = signals.includes('wizards_detected') || signals.includes('french_edition');
  const isBorderlineTarget = allowBorderlineTargets && hasTargetSignal && score >= candidateScoreFloor;
  const keep = hasTargetSignal && noise.length === 0 && (score >= minScore || isBorderlineTarget);

  let reason = 'candidate_ok';
  if (noise.length > 0) reason = 'noise_detected';
  else if (!hasTargetSignal) reason = 'missing_wizards_or_french_signal';
  else if (score < minScore && isBorderlineTarget) reason = 'borderline_target_candidate';
  else if (score < minScore) reason = 'score_below_threshold';

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

export function isLotListingText(text = '') {
  if (!text) return false;
  const normalized = String(text);
  const hasExplicitCount = /\b([2-9]|[1-9]\d+)\s*(cartes?|cards?)\b/i.test(normalized);
  const hasLotSignal = LOT_PATTERN.test(normalized);

  if (SINGLE_CARD_PATTERN.test(normalized) && !hasExplicitCount && !hasLotSignal) {
    return false;
  }

  return hasLotSignal || hasExplicitCount;
}

export function selectExplorationCandidates(listings, options = {}) {
  const limit = options.limit ?? 5;

  return listings
    .map((listing) => annotateListingQuality(listing, options))
    .filter((listing) => {
      const text = textOf(listing);
      return POKEMON_CARD_PATTERN.test(text) && listing.quality.noise.length === 0;
    })
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, limit)
    .map((listing) => ({
      ...listing,
      quality: {
        ...listing.quality,
        keep: true,
        reason: 'exploration_fallback_candidate',
      },
      score_breakdown: {
        ...(listing.score_breakdown || {}),
        signals: [...new Set([...(listing.score_breakdown?.signals || []), 'exploration_candidate'])],
        risks: [...new Set([...(listing.score_breakdown?.risks || []), 'manual_review_needed'])],
        quality: {
          ...listing.quality,
          keep: true,
          reason: 'exploration_fallback_candidate',
        },
      },
    }));
}

export function filterQualityListings(listings, options = {}) {
  return listings
    .map((listing) => annotateListingQuality(listing, options))
    .filter((listing) => listing.quality.keep);
}
