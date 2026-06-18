import { config } from '../utils/config.js';

function textOf(listing) {
  return `${listing.title || ''} ${listing.description || ''}`.toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function detectSeries(text) {
  const series = [];
  if (/\b(team\s*rocket|rocket)\b/i.test(text) || (/\bobscur(?:e|s)?\b/i.test(text) && /\/82\b/.test(text))) series.push('rocket');
  if (/\b(jungle)\b|\/64\b|\b(aeromite|aéromite|aquali|vaporeon|voltali|jolteon|pyroli|flareon|ronflex|snorlax|scarabrute|pinsir|insécateur|insecateur|scyther|nidoqueen|kangourex|kangaskhan|rafflesia|vileplume|victreebel|m\.mime|mr\s+mime|ossatueur|marowak|roucarnage|pidgeot)\b/i.test(text)) series.push('jungle');
  if (/\b(fossile|fossil)\b/i.test(text)) series.push('fossil');
  if (/\b(set\s*de\s*base|base\s*set)\b/i.test(text)) series.push('base');
  if (/\b(neo\s*destiny|neo destiny|105)\b/i.test(text)) series.push('neo');
  if (/\b(wizards|wizard|wotc)\b/i.test(text)) series.push('wizards');
  return unique(series);
}

function detectLanguage(text) {
  const french = /\b(fr|vf|français|francais|française|francaise|édition française|edition francaise|langue\s*:?\s*fran[cç]ais(?:e)?)\b/i.test(text);
  const foreign = /\b(english|anglais|japanese|japonais|japonaise|allemand|german|italien|italienne|italian|italiano|italiana|italiane|ita|espagnol|spanish)\b/i.test(text);
  return { french, foreign };
}

function detectLot(text) {
  const explicitCount = text.match(/\b([2-9]|[1-9]\d+)\s*(cartes?|cards?)\b/i);
  const lotSignal = /\b(lot|collection|vrac|classeur|set complet|complete set)\b/i.test(text);
  const singleSignal = /\b(carte seule|carte unique|à l'unité|a l'unite|unitaire|single card)\b/i.test(text);
  return {
    isLot: Boolean(explicitCount || lotSignal) && !singleSignal,
    explicitCount: explicitCount ? Number(explicitCount[1]) : null,
  };
}

function detectRisks(text) {
  const risks = [];
  if (/\b(écarlate|ecarlate|violet|epee|épée|bouclier|sword|shield|scarlet|sun|moon|soleil|lune|moderne|display moderne|booster moderne|diamant\s*&?\s*perle|diamant\s+et\s+perle|dp\s*0?\d|dp01|dp02|trésors?\s+mystérieux|tresors?\s+mysterieux|pokemon\s+go|pokémon\s+go)\b|\/(?:78|123|130|236)\b/i.test(text)) risks.push('modern_detected');
  if (/\b(fake|proxy|reproduction|repro|custom|fan made|non officiel)\b/i.test(text)) risks.push('fake_detected');
  if (/\b(figurine|peluche|jouet|mug|poster|sticker|autocollant)\b/i.test(text)) risks.push('toy_detected');
  return unique(risks);
}

export function explainListingScore(listing) {
  const text = textOf(listing);
  const series = detectSeries(text);
  const language = detectLanguage(text);
  const lot = detectLot(text);
  const risks = detectRisks(text);
  const price = Number(listing.price || 0);
  const distance = Number(listing.distance_km ?? 0);

  const subscores = {
    series: { points: 0, max: 40, reasons: [] },
    language: { points: 0, max: 20, reasons: [] },
    lot: { points: 0, max: 15, reasons: [] },
    price: { points: 0, max: 15, reasons: [] },
    distance: { points: 0, max: 10, reasons: [] },
    risk: { points: 0, max: 0, reasons: [] },
  };

  if (series.includes('rocket')) {
    subscores.series.points += 35;
    subscores.series.reasons.push('Team Rocket détecté');
  } else if (series.some(item => ['base', 'jungle', 'fossil', 'neo'].includes(item))) {
    subscores.series.points += 25;
    subscores.series.reasons.push(`Série Wizards détectée: ${series.filter(item => item !== 'wizards').join(', ')}`);
  } else if (series.includes('wizards')) {
    subscores.series.points += 18;
    subscores.series.reasons.push('Signal Wizards générique');
  }
  subscores.series.points = Math.min(subscores.series.points, subscores.series.max);

  if (language.french) {
    subscores.language.points += 18;
    subscores.language.reasons.push('Langue française probable');
  }
  if (language.foreign && !language.french) {
    subscores.language.points -= 8;
    subscores.language.reasons.push('Langue étrangère probable');
  }
  subscores.language.points = Math.max(0, Math.min(subscores.language.points, subscores.language.max));

  if (lot.isLot) {
    subscores.lot.points += lot.explicitCount && lot.explicitCount >= 50 ? 15 : 10;
    subscores.lot.reasons.push(lot.explicitCount ? `${lot.explicitCount} cartes détectées` : 'Lot ou collection détecté');
  } else {
    subscores.lot.reasons.push('Carte seule: pas de bonus lot');
  }

  if (price > 0) {
    if (price <= 20) subscores.price.points = 15;
    else if (price <= 50) subscores.price.points = 12;
    else if (price <= 100) subscores.price.points = 8;
    else if (price <= 300) subscores.price.points = 5;
    else subscores.price.points = 2;
    subscores.price.reasons.push(`Prix analysé: ${price}€`);
  }

  if (Number.isFinite(distance) && distance > 0) {
    if (distance <= 10) subscores.distance.points = 10;
    else if (distance <= 25) subscores.distance.points = 7;
    else if (distance <= 50) subscores.distance.points = 4;
    else subscores.distance.points = 1;
    subscores.distance.reasons.push(`Distance estimée: ${distance} km`);
  } else {
    subscores.distance.reasons.push('Distance inconnue');
  }

  if (risks.length > 0) {
    subscores.risk.points = -Math.min(30, risks.length * 15);
    subscores.risk.reasons.push(...risks);
  }

  const score = Math.max(0, Math.min(100, Math.round(
    Object.values(subscores).reduce((total, item) => total + item.points, 0)
  )));

  const signals = [];
  if (series.length > 0) signals.push('wizards_detected');
  if (language.french) signals.push('french_edition');
  if (lot.isLot) signals.push('lot_detected');
  if (/\b(holo|holographique|brillante|rare|dracaufeu|tortank|florizarre|mewtwo|ronflex|alakazam|raichu|dracolosse)\b/i.test(text)) signals.push('premium_card_detected');

  const explanationParts = unique([
    ...subscores.series.reasons,
    ...subscores.language.reasons,
    ...subscores.lot.reasons,
    ...subscores.price.reasons,
  ]);

  return {
    ...listing,
    score,
    score_breakdown: {
      ...(listing.score_breakdown || {}),
      subscores,
      signals: unique([...(listing.score_breakdown?.signals || []), ...signals]),
      risks: unique([...(listing.score_breakdown?.risks || []), ...risks]),
      series_detected: series,
      explanation: explanationParts.join(' · '),
    },
  };
}

/**
 * Score a listing based on multiple criteria
 * @param {Object} listing - Listing data with title, description, price, distance, etc.
 * @returns {number} Score between 0-100
 */
export function scoreListing(listing) {
  return explainListingScore(listing).score;
}
