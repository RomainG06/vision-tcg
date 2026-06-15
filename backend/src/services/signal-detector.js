/**
 * Signal Detector Service
 * Détecte les signaux d'opportunité et de risque dans les annonces
 * Conforme à PROJECT_BIBLE.md Section 6
 */

/**
 * Détecte les signaux d'opportunité dans un listing
 * @param {Object} listing - Listing normalisé
 * @param {Object} profile - Profile de chasse
 * @returns {Array<string>} Liste des signaux détectés
 */
export function detectOpportunitySignals(listing, profile) {
  const signals = [];
  
  const fullText = `${listing.title} ${listing.description || ''}`.toLowerCase();
  
  // 1. wizards_detected - Cartes Wizards mentionnées
  const wizardsKeywords = [
    'wizard', 'wizards',
    'base set', 'jungle', 'fossile', 'fossil',
    'team rocket', 'gym heroes', 'gym challenge',
    'neo genesis', 'neo discovery', 'neo revelation', 'neo destiny',
    '1ere edition', '1ère édition', '1st edition', 'shadowless'
  ];
  
  if (wizardsKeywords.some(kw => fullText.includes(kw))) {
    signals.push('wizards_detected');
  }
  
  // 2. french_edition - Édition française
  const frenchKeywords = [
    'français', 'francais', 'française', 'francaise',
    'fr ', ' fr', 'vf', 'version française',
    'édition française', 'edition francaise'
  ];
  
  if (frenchKeywords.some(kw => fullText.includes(kw))) {
    signals.push('french_edition');
  }
  
  // 3. lot_detected - Lot de cartes (ratio avantageux)
  if (listing.card_count && listing.card_count >= 10) {
    signals.push('lot_detected');
  } else if (/\blot\b|\blots\b/i.test(fullText)) {
    signals.push('lot_detected');
  }
  
  // 4. near_location - Proche géographiquement
  if (listing.distance_km && listing.distance_km <= 10) {
    signals.push('near_location');
  }
  
  // 5. below_market - Prix sous le marché (placeholder pour Phase 2.9)
  // Sera implémenté avec l'estimation de valeur
  // Pour l'instant, on détecte les prix "trop beaux"
  if (listing.price && listing.price < 50 && listing.card_count > 100) {
    signals.push('below_market');
  }
  
  // 6. rare_cards - Cartes rares mentionnées
  const rareCards = [
    'charizard', 'dracaufeu', 'blastoise', 'tortank',
    'venusaur', 'florizarre', 'mewtwo', 'mew',
    'lugia', 'ho-oh', 'celebi', 'tyranocif', 'tyranitar',
    'alakazam', 'machamp', 'draco', 'ectoplasma', 'gengar'
  ];
  
  if (rareCards.some(card => fullText.includes(card))) {
    signals.push('rare_cards');
  }
  
  // 7. holographic - Cartes holographiques
  const holoKeywords = [
    'holo', 'holographique', 'brillante', 'shiny',
    'reverse', 'full art', 'ultra rare', 'secret rare'
  ];
  
  if (holoKeywords.some(kw => fullText.includes(kw))) {
    signals.push('holographic');
  }
  
  // 8. complete_set - Set complet
  if (/\bcomplet\b|\bcomplete\b|\bentier\b/i.test(fullText)) {
    signals.push('complete_set');
  }
  
  return signals;
}

/**
 * Détecte les signaux de risque dans un listing
 * @param {Object} listing - Listing normalisé
 * @returns {Array<string>} Liste des risques détectés
 */
export function detectRiskSignals(listing) {
  const risks = [];
  
  const fullText = `${listing.title} ${listing.description || ''}`.toLowerCase();
  
  // 1. condition_unclear - État non précisé
  const conditionKeywords = [
    'état', 'etat', 'condition', 'neuf', 'occasion',
    'mint', 'near mint', 'nm', 'lp', 'played',
    'excellent', 'bon', 'moyen', 'abîmé', 'abime'
  ];
  
  if (!conditionKeywords.some(kw => fullText.includes(kw))) {
    risks.push('condition_unclear');
  }
  
  // 2. incomplete_photos - Peu de photos
  const imageCount = listing.images ? 
    (Array.isArray(listing.images) ? listing.images.length : listing.images.split(',').filter(x => x).length) 
    : 0;
  
  if (imageCount < 3) {
    risks.push('incomplete_photos');
  }
  
  // 3. suspicious_price - Prix suspect (trop bas)
  // Prix < 20€ pour lot de +500 cartes = suspect
  if (listing.price && listing.price < 20 && listing.card_count > 500) {
    risks.push('suspicious_price');
  }
  
  // Prix > 1000€ pour cartes non gradées = suspect
  if (listing.price && listing.price > 1000 && !/\bpsa\b|\bcgc\b|\bgrade\b/i.test(fullText)) {
    risks.push('suspicious_price');
  }
  
  // 4. vague_description - Description trop courte
  if (!listing.description || listing.description.length < 50) {
    risks.push('vague_description');
  }
  
  // 5. no_returns - Pas de retour possible
  if (/\bpas de retour\b|\bno return\b|\bvendu en l'état\b/i.test(fullText)) {
    risks.push('no_returns');
  }
  
  // 6. fake_risk - Mots-clés de risque de contrefaçon
  const fakeKeywords = [
    'proxy', 'copie', 'reproduction', 'imitation',
    'custom', 'fan made', 'non officiel'
  ];
  
  if (fakeKeywords.some(kw => fullText.includes(kw))) {
    risks.push('fake_risk');
  }
  
  // 7. urgent_sale - Vente urgente (peut cacher un problème)
  if (/\burgent\b|\bvite\b|\brapide\b|\bdépart imminent\b/i.test(fullText)) {
    risks.push('urgent_sale');
  }
  
  return risks;
}

/**
 * Génère une explication textuelle du score et des signaux
 * @param {Object} listing - Listing avec signals
 * @param {Object} scoreBreakdown - Détail du score
 * @returns {string} Explication lisible
 */
export function generateExplanation(listing, scoreBreakdown) {
  const lines = [];
  
  const opportunitySignals = listing.opportunity_signals || [];
  const riskSignals = listing.risk_signals || [];
  
  // Header basé sur le score
  if (listing.score >= 90) {
    lines.push('💎 **OPPORTUNITÉ EXCEPTIONNELLE**');
  } else if (listing.score >= 75) {
    lines.push('🔥 **TRÈS INTÉRESSANT**');
  } else if (listing.score >= 60) {
    lines.push('⭐ **INTÉRESSANT**');
  } else {
    lines.push('📋 **À CONSIDÉRER**');
  }
  
  lines.push('');
  lines.push('**Pourquoi c\'est intéressant ?**');
  
  // Signaux d'opportunité
  if (opportunitySignals.includes('wizards_detected')) {
    lines.push('- 🔥 Cartes Wizards détectées (éditions recherchées)');
  }
  
  if (opportunitySignals.includes('french_edition')) {
    lines.push('- 🇫🇷 Édition française (valorisation supérieure)');
  }
  
  if (opportunitySignals.includes('lot_detected')) {
    const count = listing.card_count || '?';
    lines.push(`- 📦 Lot de ${count} cartes (meilleur ratio prix/carte)`);
  }
  
  if (opportunitySignals.includes('near_location')) {
    const dist = listing.distance_km ? `${listing.distance_km.toFixed(1)} km` : 'proximité';
    lines.push(`- 📍 À ${dist} (facile à récupérer)`);
  }
  
  if (opportunitySignals.includes('below_market')) {
    if (listing.gain_potential && listing.gain_percentage) {
      lines.push(`- 💰 Prix sous le marché (gain potentiel : ${listing.gain_potential}€ / +${listing.gain_percentage}%)`);
    } else {
      lines.push('- 💰 Prix potentiellement sous le marché');
    }
  }
  
  if (opportunitySignals.includes('rare_cards')) {
    lines.push('- ✨ Cartes rares mentionnées');
  }
  
  if (opportunitySignals.includes('holographic')) {
    lines.push('- 🌟 Cartes holographiques incluses');
  }
  
  if (opportunitySignals.includes('complete_set')) {
    lines.push('- 📚 Set complet ou quasi-complet');
  }
  
  // Score breakdown détaillé
  lines.push('');
  lines.push('**Détail du score :**');
  
  if (scoreBreakdown.keywords !== undefined) {
    lines.push(`- Mots-clés : ${scoreBreakdown.keywords.toFixed(0)}/100`);
  }
  
  if (scoreBreakdown.price !== undefined) {
    lines.push(`- Prix : ${scoreBreakdown.price.toFixed(0)}/100`);
  }
  
  if (scoreBreakdown.distance !== undefined) {
    lines.push(`- Distance : ${scoreBreakdown.distance.toFixed(0)}/100`);
  }
  
  if (scoreBreakdown.is_lot !== undefined) {
    lines.push(`- Type lot : ${scoreBreakdown.is_lot.toFixed(0)}/100`);
  }
  
  // Estimation de valeur
  if (listing.value_estimate_low && listing.value_estimate_high) {
    lines.push('');
    lines.push('**Estimation de valeur :**');
    lines.push(`- Fourchette : ${listing.value_estimate_low}€ - ${listing.value_estimate_high}€`);
    lines.push(`- Confiance : ${listing.confidence}`);
    if (listing.gain_potential !== null) {
      const gainSign = listing.gain_potential >= 0 ? '+' : '';
      lines.push(`- Gain potentiel : ${gainSign}${listing.gain_potential}€ (${gainSign}${listing.gain_percentage}%)`);
    }
    if (listing.methodology) {
      lines.push(`- Méthode : ${listing.methodology}`);
    }
  }
  
  // Signaux de risque
  if (riskSignals.length > 0) {
    lines.push('');
    lines.push('⚠️ **Points de vigilance :**');
    
    if (riskSignals.includes('condition_unclear')) {
      lines.push('- État des cartes non précisé');
    }
    
    if (riskSignals.includes('incomplete_photos')) {
      lines.push('- Peu de photos (< 3)');
    }
    
    if (riskSignals.includes('suspicious_price')) {
      lines.push('- Prix suspect (trop bas ou trop haut)');
    }
    
    if (riskSignals.includes('vague_description')) {
      lines.push('- Description trop courte');
    }
    
    if (riskSignals.includes('no_returns')) {
      lines.push('- Vente sans retour possible');
    }
    
    if (riskSignals.includes('fake_risk')) {
      lines.push('- ⚠️ Risque de contrefaçon mentionné');
    }
    
    if (riskSignals.includes('urgent_sale')) {
      lines.push('- Vente urgente (vérifier la raison)');
    }
  }
  
  return lines.join('\n');
}

/**
 * Génère les badges visuels pour un listing
 * @param {Object} listing - Listing avec signals
 * @returns {Array<string>} Liste de badges
 */
export function generateBadges(listing) {
  const badges = [];
  
  const opportunitySignals = listing.opportunity_signals || [];
  const riskSignals = listing.risk_signals || [];
  
  // Badges d'opportunité
  if (opportunitySignals.includes('wizards_detected')) {
    badges.push('🔥 WIZARDS');
  }
  
  if (opportunitySignals.includes('french_edition')) {
    badges.push('🇫🇷 FR');
  }
  
  if (opportunitySignals.includes('lot_detected')) {
    badges.push('📦 LOT');
  }
  
  if (listing.distance_km && listing.distance_km <= 5) {
    badges.push(`📍 ${listing.distance_km.toFixed(0)} KM`);
  } else if (listing.distance_km && listing.distance_km <= 20) {
    badges.push(`📍 ${listing.distance_km.toFixed(0)} KM`);
  }
  
  if (opportunitySignals.includes('below_market')) {
    if (listing.gain_percentage && listing.gain_percentage > 50) {
      badges.push(`💎 -${listing.gain_percentage}%`);
    } else {
      badges.push('💸 SOUS-COTÉ');
    }
  }
  
  if (opportunitySignals.includes('rare_cards')) {
    badges.push('✨ RARES');
  }
  
  if (opportunitySignals.includes('holographic')) {
    badges.push('🌟 HOLO');
  }
  
  if (opportunitySignals.includes('complete_set')) {
    badges.push('📚 SET COMPLET');
  }
  
  // Badges de risque (max 2 pour ne pas polluer)
  if (riskSignals.includes('fake_risk')) {
    badges.push('⚠️ RISQUE');
  }
  
  if (riskSignals.includes('suspicious_price')) {
    badges.push('⚠️ PRIX SUSPECT');
  }
  
  return badges;
}

/**
 * Enrichit un listing avec tous les signaux et explications
 * @param {Object} listing - Listing normalisé avec score
 * @param {Object} profile - Profile de chasse
 * @param {Object} estimation - Optional value estimation (if not provided, will be calculated)
 * @returns {Object} Listing enrichi
 */
export function enrichListing(listing, profile, estimation = null) {
  const opportunitySignals = detectOpportunitySignals(listing, profile);
  const riskSignals = detectRiskSignals(listing);
  
  let enriched = {
    ...listing,
    opportunity_signals: opportunitySignals,
    risk_signals: riskSignals
  };
  
  // Ajouter l'estimation si fournie
  if (estimation) {
    enriched = {
      ...enriched,
      ...estimation
    };
    
    // Mettre à jour le signal below_market si gain significatif
    if (estimation.gain_percentage > 30 && estimation.confidence !== 'low') {
      if (!enriched.opportunity_signals.includes('below_market')) {
        enriched.opportunity_signals = [...enriched.opportunity_signals, 'below_market'];
      }
    }
  }
  
  const explanation = generateExplanation(enriched, listing.score_breakdown || {});
  const badges = generateBadges(enriched);
  
  enriched.explanation = explanation;
  enriched.badges = badges;
  
  return enriched;
}
