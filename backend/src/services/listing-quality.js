import { detectLanguageSignals } from './language-detection.js';

const WIZARDS_PATTERN = /\b(wizards|wotc|base set|set de base|jungle|fossile|fossil|team rocket|gym|neo genesis|neo|wizard)\b/i;
const LOT_PATTERN = /\b(lot|collection|vrac|classeur|set complet|complete set)\b/i;
const SINGLE_CARD_PATTERN = /\b(carte seule|carte unique|à l'unité|a l'unite|unitaire|single card|dracaufeu|tortank|florizarre|mewtwo|pikachu)\b/i;
const POKEMON_CARD_PATTERN = /\b(pokemon|pokémon|carte|cartes|holo|rare|jungle|fossile|fossil|rocket|dracaufeu|tortank|florizarre|mewtwo|pikachu)\b/i;

const TARGET_SERIES_PATTERNS = {
  rocket: /\b(team\s*rocket|rocket|dark\s+(?:charizard|blastoise|dragonite|raichu|alakazam|magneton|hypno|slowbro|arbok|dugtrio|golbat|gyarados|machamp|vileplume|weezing)|(?:dracaufeu|dracofeu|tortank|dracolosse|raichu|alakazam|magneton|magnéton|hypnomade|flagadoss|arbok|triopikeur|nosferalto|leviator|léviator|mackogneur|rafflesia|rafflésia|smogogo|ossatueur|ramoloss|slowbro)\s+(?:obscur(?:e|s)?|sombre?s?))\b|\bobscur(?:e|s)?\b(?=.*\/82\b)/i,
  jungle: /\b(jungle)\b|\/64\b|\b(aeromite|aéromite|aquali|vaporeon|voltali|jolteon|pyroli|flareon|ronflex|snorlax|scarabrute|pinsir|insécateur|insecateur|scyther|nidoqueen|kangourex|kangaskhan|electhor|électhor|jolteon|rafflesia|vileplume|victreebel|m\.mime|mr\s+mime|ossatueur|marowak|roucarnage|pidgeot)\b/i,
  fossil: /\b(fossile|fossil)\b|\/62\b|\b(artikodin|articuno|electhor|électhor|zapdos|sulfura|moltres|dracolosse|dragonite|ectoplasma|gengar|lokhlass|lapras|kabutops|ptéra|ptera|aerodactyl|hypnomade|hypno|magneton)\b/i,
  base: /\b(set\s*de\s*base|base\s*set)\b|\/102\b|\b(dracaufeu|charizard|tortank|blastoise|florizarre|venusaur|alakazam|leveinard|chansey|raichu|mewtwo|magneton|nidoking|feunard|ninetales)\b/i,
};

const NOISE_PATTERNS = [
  { code: 'modern_detected', pattern: /\b(écarlate|ecarlate|violet|epee|épée|bouclier|sword|shield|scarlet|sun|moon|soleil|lune|moderne|display moderne|booster moderne|diamant\s*&?\s*perle|diamant\s+et\s+perle|dp\s*0?\d|dp01|dp02|trésors?\s+mystérieux|tresors?\s+mysterieux|pokemon\s+go|pokémon\s+go)\b|\/(?:78|123|130|236)\b/i },
  { code: 'accessory_detected', pattern: /\b(sleeves?|protections?|toploader|top loader|classeur vide|binder empty|accessoires?|rangement|boite vide|box vide)\b/i },
  { code: 'foreign_language_detected', predicate: text => detectLanguageSignals(text).foreign },
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

const POSITIVE_REASON_LABELS = {
  wizards_detected: 'Série Wizards / ancienne détectée',
  french_edition: 'Langue française probable',
  lot_detected: 'Lot ou collection détecté',
  premium_card_detected: 'Carte rare/holo détectée',
  exploration_candidate: 'Candidat Pokémon à vérifier',
};

const RISK_REASON_LABELS = {
  modern_detected: 'Bloc moderne détecté',
  accessory_detected: 'Accessoire probablement vendu seul',
  foreign_language_detected: 'Langue étrangère probable',
  fake_detected: 'Fake/proxy/reproduction détecté',
  energy_bulk_detected: 'Lot énergie / vrac faible valeur',
  toy_detected: 'Produit dérivé plutôt qu’une carte',
  manual_review_needed: 'Vérification manuelle nécessaire',
  series_mismatch: 'Série ciblée non détectée',
  listing_type_mismatch: 'Type d’annonce non conforme',
};

function isSeriesTargeted(targetSeries) {
  return Boolean(targetSeries && targetSeries !== 'all' && TARGET_SERIES_PATTERNS[targetSeries]);
}

function matchesTargetSeries(text, targetSeries) {
  if (!isSeriesTargeted(targetSeries)) return true;
  return TARGET_SERIES_PATTERNS[targetSeries].test(text);
}

function matchesListingType(text, listingType) {
  if (!listingType || listingType === 'all') return true;
  const isLot = isLotListingText(text);
  if (listingType === 'lot') return isLot;
  if (listingType === 'cards') return !isLot;
  return true;
}

function buildDecisionReasons({ signals, noise, reason, price, budgetMax }) {
  const positive = signals
    .map(signal => POSITIVE_REASON_LABELS[signal])
    .filter(Boolean);
  const risks = noise
    .map(risk => RISK_REASON_LABELS[risk])
    .filter(Boolean);

  if (reason === 'missing_wizards_or_french_signal') risks.push('Signal Wizards/FR insuffisant');
  if (reason === 'series_mismatch') risks.push('Série ciblée non détectée');
  if (reason === 'listing_type_mismatch') risks.push('Type d’annonce non conforme');
  if (reason === 'score_below_threshold') risks.push('Score sous le seuil radar');
  if (reason === 'borderline_target_candidate') risks.push('Signal cible présent mais confiance limitée');
  if (reason === 'exploration_fallback_candidate') {
    risks.push('Candidat large gardé pour revue');
    if (!signals.includes('wizards_detected') && !signals.includes('french_edition')) {
      risks.push('Signal Wizards/FR insuffisant');
    }
  }
  if (Number.isFinite(Number(budgetMax)) && Number(budgetMax) > 0 && Number(price || 0) > Number(budgetMax)) risks.push('Prix au-dessus du budget');

  return {
    positive_reasons: [...new Set(positive)],
    risk_reasons: [...new Set(risks)],
  };
}

function tierFromQuality({ keep, reason, score, noise, signals, budgetRejected }) {
  if (budgetRejected) return 'rejected_budget';
  if (!keep && reason === 'series_mismatch') return 'rejected_series_mismatch';
  if (!keep && reason === 'listing_type_mismatch') return 'rejected_type_mismatch';
  if (noise.length > 0) return 'rejected_noise';
  if (!keep && reason === 'missing_wizards_or_french_signal') return 'rejected_no_signal';
  if (!keep) return 'rejected_low_score';
  if (reason === 'exploration_fallback_candidate') return 'manual_review';
  if (score >= 75 && signals.length >= 2) return 'strong_opportunity';
  if (score >= 50 || signals.includes('wizards_detected') || signals.includes('french_edition')) return 'good_candidate';
  return 'manual_review';
}

function suggestionFromTier(tier) {
  if (tier === 'strong_opportunity') return 'contacter_rapidement';
  if (tier === 'good_candidate') return 'examiner';
  if (tier === 'manual_review') return 'verifier_manuellement';
  return 'ignorer';
}

export function classifyListingQuality(listing, options = {}) {
  const base = evaluateListingQuality(listing, options);
  const price = Number(listing.price || 0);
  const budgetMax = options.budgetMax ?? options.budget ?? null;
  const budgetRejected = Number.isFinite(Number(budgetMax)) && Number(budgetMax) > 0 && price > Number(budgetMax);
  const text = textOf(listing);
  const seriesMismatch = isSeriesTargeted(options.targetSeries) && !matchesTargetSeries(text, options.targetSeries);
  const listingTypeMismatch = !matchesListingType(text, options.listingType || options.listing_type || options.type || 'all');
  let keep = base.keep && !budgetRejected && !seriesMismatch && !listingTypeMismatch;
  let reason = budgetRejected
    ? 'over_budget'
    : seriesMismatch
      ? 'series_mismatch'
      : listingTypeMismatch
        ? 'listing_type_mismatch'
        : base.reason;

  if (!keep && options.allowExplorationFallback && !budgetRejected && !seriesMismatch && !listingTypeMismatch && base.noise.length === 0 && POKEMON_CARD_PATTERN.test(text)) {
    keep = true;
    reason = 'exploration_fallback_candidate';
  }

  const tier = tierFromQuality({
    keep,
    reason,
    score: base.score,
    noise: budgetRejected ? [] : base.noise,
    signals: base.signals,
    budgetRejected,
  });
  const reasons = buildDecisionReasons({
    signals: reason === 'exploration_fallback_candidate'
      ? [...new Set([...base.signals, 'exploration_candidate'])]
      : base.signals,
    noise: budgetRejected ? [] : base.noise,
    reason,
    price,
    budgetMax,
  });

  return {
    ...base,
    keep,
    reason,
    quality_tier: tier,
    action_suggestion: suggestionFromTier(tier),
    ...reasons,
  };
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
  if (detectLanguageSignals(text).french) signals.push('french_edition');
  if (isLotListingText(text)) signals.push('lot_detected');
  if (/\b(holo|holographique|brillante|rare|dracaufeu|tortank|florizarre|mewtwo|ronflex)\b/i.test(text)) signals.push('premium_card_detected');

  for (const rule of NOISE_PATTERNS) {
    const matches = rule.pattern ? rule.pattern.test(text) : rule.predicate?.(text);
    if (matches && !shouldIgnoreNoise(rule.code, text, signals)) {
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
  const quality = classifyListingQuality(listing, options);
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
      return POKEMON_CARD_PATTERN.test(text)
        && matchesTargetSeries(text, options.targetSeries)
        && matchesListingType(text, options.listingType || options.listing_type || options.type || 'all')
        && listing.quality.noise.length === 0;
    })
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, limit)
    .map((listing) => ({
      ...listing,
      quality: {
        ...listing.quality,
        keep: true,
        reason: 'exploration_fallback_candidate',
        quality_tier: 'manual_review',
        action_suggestion: 'verifier_manuellement',
        positive_reasons: [...new Set([...(listing.quality.positive_reasons || []), 'Candidat Pokémon à vérifier'])],
        risk_reasons: [...new Set([...(listing.quality.risk_reasons || []), 'Candidat large gardé pour revue'])],
      },
      score_breakdown: {
        ...(listing.score_breakdown || {}),
        signals: [...new Set([...(listing.score_breakdown?.signals || []), 'exploration_candidate'])],
        risks: [...new Set([...(listing.score_breakdown?.risks || []), 'manual_review_needed'])],
        quality: {
          ...listing.quality,
          keep: true,
          reason: 'exploration_fallback_candidate',
          quality_tier: 'manual_review',
          action_suggestion: 'verifier_manuellement',
          positive_reasons: [...new Set([...(listing.quality.positive_reasons || []), 'Candidat Pokémon à vérifier'])],
          risk_reasons: [...new Set([...(listing.quality.risk_reasons || []), 'Candidat large gardé pour revue'])],
        },
      },
    }));
}

export function formatRejectedListing(listing) {
  const quality = listing.quality || listing.score_breakdown?.quality || {};
  const risks = [...(quality.noise || listing.score_breakdown?.risks || [])];
  if (quality.reason === 'series_mismatch') risks.push('series_mismatch');
  if (quality.reason === 'listing_type_mismatch') risks.push('listing_type_mismatch');
  if (quality.reason === 'over_budget') risks.push('over_budget');

  return {
    title: listing.title || 'Annonce sans titre',
    price: listing.price ?? null,
    url: listing.url || null,
    source: listing.source || null,
    external_id: listing.external_id || listing.id || null,
    score: Number(listing.score || quality.score || 0),
    rejection_reason: quality.reason || 'unknown',
    signals: quality.signals || listing.score_breakdown?.signals || [],
    risks: [...new Set(risks)],
  };
}

export function splitQualityListings(listings, options = {}) {
  const rejectedLimit = options.rejectedLimit ?? 20;
  const kept = [];
  const rejected = [];

  for (const listing of listings.map((item) => annotateListingQuality(item, options))) {
    if (listing.quality.keep) {
      kept.push(listing);
    } else if (rejected.length < rejectedLimit) {
      rejected.push(formatRejectedListing(listing));
    }
  }

  return { kept, rejected };
}

export function filterQualityListings(listings, options = {}) {
  return splitQualityListings(listings, options).kept;
}
