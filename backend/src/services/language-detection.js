const FRENCH_LANGUAGE_PATTERN = /\b(fr|vf|français|francais|française|francaise|édition\s+française|edition\s+francaise|langue\s*:?\s*fran[cç]ais(?:e)?)\b/i;
const FOREIGN_LANGUAGE_PATTERN = /\b(japonais|japonaise|japonaises|japanese|anglais|english|allemand|german|italien|italienne|italiennes|italian|italiano|italiana|italiane|ita|espagnol|spanish|español|portugais|portuguese|chinois|chinese|korean|coréen|coreen)\b/i;

export function detectLanguageSignals(text = '') {
  const value = String(text || '');
  return {
    french: FRENCH_LANGUAGE_PATTERN.test(value),
    foreign: FOREIGN_LANGUAGE_PATTERN.test(value),
  };
}

export function hasFrenchLanguageSignal(text = '') {
  return detectLanguageSignals(text).french;
}

export function hasForeignLanguageSignal(text = '') {
  return detectLanguageSignals(text).foreign;
}

export function isForeignLanguageOnly(text = '') {
  const language = detectLanguageSignals(text);
  return language.foreign && !language.french;
}
