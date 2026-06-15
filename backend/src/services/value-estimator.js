/**
 * Value Estimator Service
 * Estime la valeur d'un lot de cartes Pokémon
 * Conforme à PROJECT_BIBLE.md Section 7
 */

/**
 * Estime la valeur d'un listing basé sur des business rules
 * @param {Object} listing - Listing normalisé avec signals
 * @returns {Object} { low, high, confidence, methodology, gain_potential }
 */
export function estimateValue(listing) {
  const fullText = `${listing.title} ${listing.description || ''}`.toLowerCase();
  const opportunitySignals = listing.opportunity_signals || [];
  
  // 1. Déterminer le nombre de cartes
  let cardCount = listing.card_count || estimateCardCount(fullText);
  
  if (cardCount === 0) {
    // Pas assez d'info pour estimer
    return {
      value_estimate_low: null,
      value_estimate_high: null,
      confidence: 'low',
      methodology: 'Nombre de cartes inconnu, estimation impossible',
      gain_potential: null
    };
  }
  
  // 2. Prix de base par carte (0,10€ à 0,50€ pour cartes communes modernes)
  let baseLow = 0.10;
  let baseHigh = 0.50;
  
  // 3. Appliquer les multiplicateurs
  let multiplierLow = 1.0;
  let multiplierHigh = 1.0;
  let confidenceScore = 50; // Score 0-100
  const reasons = [];
  
  // 3.1. Wizards (× 3 à × 5)
  if (opportunitySignals.includes('wizards_detected')) {
    multiplierLow *= 3.0;
    multiplierHigh *= 5.0;
    confidenceScore += 20;
    reasons.push('Éditions Wizards (× 3-5)');
  }
  
  // 3.2. Français (× 1.5 à × 2)
  if (opportunitySignals.includes('french_edition')) {
    multiplierLow *= 1.5;
    multiplierHigh *= 2.0;
    confidenceScore += 10;
    reasons.push('Édition française (× 1.5-2)');
  }
  
  // 3.3. Holographiques (× 3 à × 10)
  if (opportunitySignals.includes('holographic')) {
    multiplierLow *= 3.0;
    multiplierHigh *= 10.0;
    confidenceScore += 15;
    reasons.push('Cartes holographiques (× 3-10)');
  }
  
  // 3.4. Cartes rares (× 2 à × 5)
  if (opportunitySignals.includes('rare_cards')) {
    multiplierLow *= 2.0;
    multiplierHigh *= 5.0;
    confidenceScore += 15;
    reasons.push('Cartes rares mentionnées (× 2-5)');
  }
  
  // 3.5. Set complet (× 1.5 à × 2)
  if (opportunitySignals.includes('complete_set')) {
    multiplierLow *= 1.5;
    multiplierHigh *= 2.0;
    confidenceScore += 10;
    reasons.push('Set complet (× 1.5-2)');
  }
  
  // 3.6. Détection de cartes ultra-rares spécifiques
  const ultraRares = [
    { keyword: 'charizard', name: 'Charizard', mult: [10, 50] },
    { keyword: 'dracaufeu', name: 'Dracaufeu', mult: [10, 50] },
    { keyword: 'lugia', name: 'Lugia', mult: [5, 20] },
    { keyword: 'celebi', name: 'Celebi', mult: [5, 20] },
    { keyword: 'mewtwo', name: 'Mewtwo', mult: [5, 15] },
    { keyword: '1st edition', name: '1st Edition', mult: [5, 20] },
    { keyword: '1ere edition', name: '1ère Édition', mult: [5, 20] },
    { keyword: 'shadowless', name: 'Shadowless', mult: [10, 30] }
  ];
  
  ultraRares.forEach(rare => {
    if (fullText.includes(rare.keyword)) {
      multiplierLow *= rare.mult[0];
      multiplierHigh *= rare.mult[1];
      confidenceScore += 20;
      reasons.push(`${rare.name} détecté (× ${rare.mult[0]}-${rare.mult[1]})`);
    }
  });
  
  // 4. Calcul de l'estimation
  const estimateLow = Math.round(cardCount * baseLow * multiplierLow);
  const estimateHigh = Math.round(cardCount * baseHigh * multiplierHigh);
  
  // 5. Niveau de confiance
  let confidence = 'low';
  if (confidenceScore >= 80) {
    confidence = 'high';
  } else if (confidenceScore >= 60) {
    confidence = 'medium';
  }
  
  // 6. Gain potentiel
  let gainPotential = null;
  let gainPercentage = null;
  
  if (listing.price) {
    // Utiliser la médiane de l'estimation
    const estimateMedian = (estimateLow + estimateHigh) / 2;
    gainPotential = Math.round(estimateMedian - listing.price);
    gainPercentage = Math.round((gainPotential / listing.price) * 100);
  }
  
  // 7. Méthodologie
  const methodology = reasons.length > 0
    ? `${cardCount} cartes × base €${baseLow.toFixed(2)}-€${baseHigh.toFixed(2)} avec ${reasons.join(', ')}`
    : `${cardCount} cartes × base €${baseLow.toFixed(2)}-€${baseHigh.toFixed(2)} (pas de multiplicateur)`;
  
  return {
    value_estimate_low: estimateLow,
    value_estimate_high: estimateHigh,
    confidence,
    methodology,
    gain_potential: gainPotential,
    gain_percentage: gainPercentage
  };
}

/**
 * Estime le nombre de cartes depuis le texte
 * @param {string} text - Texte de l'annonce
 * @returns {number} Nombre estimé de cartes
 */
function estimateCardCount(text) {
  // Recherche de nombres explicites
  const patterns = [
    /(\d+)\s*cartes?/i,
    /lot\s*de\s*(\d+)/i,
    /(\d+)\s*cards?/i,
    /environ\s*(\d+)/i,
    /\+\s*de\s*(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  // Mots-clés indicatifs
  if (/gros\s*lot|énorme\s*lot|huge\s*lot/i.test(text)) {
    return 500; // Estimation moyenne pour "gros lot"
  }
  
  if (/\blot\b/i.test(text)) {
    return 50; // Estimation moyenne pour "lot" générique
  }
  
  if (/collection/i.test(text)) {
    return 200; // Estimation moyenne pour "collection"
  }
  
  // Si mention de booster/display
  if (/booster|display/i.test(text)) {
    return 10; // 1 booster = ~10 cartes
  }
  
  // Par défaut : lot individuel ou petit lot
  return 1;
}

/**
 * Met à jour le signal "below_market" si gain potentiel significatif
 * @param {Object} listing - Listing avec estimation
 * @returns {Object} Listing mis à jour
 */
export function updateBelowMarketSignal(listing) {
  const updated = { ...listing };
  
  // Si gain > 30% et confiance au moins medium, ajouter le signal
  if (
    listing.gain_percentage !== null &&
    listing.gain_percentage > 30 &&
    listing.confidence !== 'low'
  ) {
    const signals = updated.opportunity_signals || [];
    if (!signals.includes('below_market')) {
      updated.opportunity_signals = [...signals, 'below_market'];
    }
  }
  
  return updated;
}
